import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StateGraph } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { z } from "zod";
import "dotenv/config";

// Define the tools for the agent to use
const createPredictionTool = (collection) => tool(
  async ({ query, patientId }) => {
    console.log("Prediction tool called for patient:", patientId);

    const dbConfig = {
      collection: collection,
      indexName: "vector_index",
      textKey: "embedding_text",
      embeddingKey: "embedding",
    };

    // Initialize vector store
    const vectorStore = new MongoDBAtlasVectorSearch(
      new OpenAIEmbeddings(),
      dbConfig
    );

    const result = await vectorStore.similaritySearch(query);
    return JSON.stringify(result);
  },
  {
    name: "prediction_lookup",
    description: "Analyzes patient data and generates health predictions",
    schema: z.object({
      query: z.string().describe("The analysis query"),
      patientId: z.string().describe("The patient ID to analyze"),
    }),
  }
);

const createRiskAssessmentTool = () => tool(
  async ({ patientData, environmentalFactors }) => {
    console.log("Risk assessment tool called");
    // Implement risk assessment logic here
    return JSON.stringify({
      riskLevel: "moderate",
      factors: ["environmental", "medical_history"],
      recommendations: ["regular_checkups", "lifestyle_changes"]
    });
  },
  {
    name: "risk_assessment",
    description: "Assesses health risks based on patient data and environmental factors",
    schema: z.object({
      patientData: z.object({}).describe("Patient medical data"),
      environmentalFactors: z.object({}).describe("Environmental factors affecting health"),
    }),
  }
);

export async function createAgent(client, collection) {
  // Define the graph state
  const GraphState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
      reducer: (x, y) => x.concat(y),
    }),
  });

  const tools = [
    createPredictionTool(collection),
    createRiskAssessmentTool()
  ];
  
  const toolNode = new ToolNode<typeof GraphState.State>(tools);

  const model = new ChatAnthropic({
    model: "claude-3-sonnet-20240229",
    temperature: 0,
  }).bindTools(tools);

  // Define the function that determines whether to continue or not
  function shouldContinue(state) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    if (lastMessage.tool_calls?.length) {
      return "tools";
    }
    return "__end__";
  }

  // Define the function that calls the model
  async function callModel(state) {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a medical analysis AI assistant specializing in health risk assessment and prediction.
         Use the provided tools to analyze patient data and generate comprehensive health insights.
         Consider both medical history and environmental factors in your analysis.
         Current time: {time}
         Available tools: {tool_names}
         {system_message}`,
      ],
      new MessagesPlaceholder("messages"),
    ]);

    const formattedPrompt = await prompt.formatMessages({
      system_message: "Medical Analysis System Active",
      time: new Date().toISOString(),
      tool_names: tools.map((tool) => tool.name).join(", "),
      messages: state.messages,
    });

    const result = await model.invoke(formattedPrompt);
    return { messages: [result] };
  }

  // Define the workflow graph
  const workflow = new StateGraph(GraphState)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

  // Initialize MongoDB memory
  const checkpointer = new MongoDBSaver({ 
    client, 
    dbName: "medical_predictions"
  });

  // Compile the graph
  const app = workflow.compile({ checkpointer });

  return app;
}

export async function runPrediction(agent, query, patientId) {
  try {
    const finalState = await agent.invoke(
      {
        messages: [new HumanMessage(query)],
      },
      { 
        recursionLimit: 10,
        configurable: { 
          thread_id: `${patientId}_${Date.now()}`,
          metadata: { patientId }
        }
      }
    );

    const lastMessage = finalState.messages[finalState.messages.length - 1];
    return lastMessage.content;
  } catch (error) {
    console.error("Error running prediction:", error);
    throw error;
  }
}