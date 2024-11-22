import { ChatVertexAI } from '@langchain/google-vertexai';
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StateGraph } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import "dotenv/config";
import { GroundConversation } from "./conversation-grounding.js";
import { tool } from "@langchain/core/tools";
import {z} from "zod";

export async function conversationAgent(client, message, threadId, predictionData) {
 
  // Define the graph state with proper type parameters
  const GraphState = Annotation.Root({
    messages: Annotation.Array<BaseMessage>([]),
    predictionContext: Annotation.Array<string>([]), // Correct type usage
    lastResponse: Annotation.Array<string>([]),     // Correct type usage
});

  // Define the grounding function as a tool
  const groundTool = tool(async ({ lastResponse }) => {
    try {
      const groundedResponse = await GroundConversation(lastResponse);
      return new AIMessage(groundedResponse);
    } catch (error) {
      console.error("Error in grounding:", error);
      return new AIMessage(lastResponse); // Fallback to original response if grounding fails
    }
  }, {
    name: "ground_tool",
    description: "Grounds the AI's last response for better context.",
    schema: z.object({
      lastResponse: z.string().describe("The last response from the AI"),
    }),
  });

  const model = new ChatVertexAI({
    model: "gemini-1.5-pro",
    temperature: 0,
  });

  // Define the function that determines whether to continue or not
  function shouldContinue(state) {
     // Check if we should ground or stop
     return state.lastResponse ? "ground" : "__end__"; // Proceed to ground if there's a response
  }

  // Define the function that calls the model
  async function callModel(state) {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a helpful AI assistant specializing in medical analysis and predictions. 
        You have access to a previous prediction/analysis made for this patient:
        
        ${state.predictionContext}
        
        Use this context to provide informed responses to the user's questions about their health assessment.
        Focus on explaining the analysis, clarifying points, and providing evidence-based information.
        
        Current time: {time}`,
      ],
      new MessagesPlaceholder("messages"),
    ]);

    const formattedPrompt = await prompt.formatMessages({
      time: new Date().toISOString(),
      messages: state.messages,
    });

    const result = await model.invoke(formattedPrompt);
    return { messages: [result], lastResponse: result.content };
  }

  // Define the graph
  const workflow = new StateGraph(GraphState)
    .addNode("agent", callModel)
    .addNode("ground", groundTool)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue, {
      ground: "ground",
    })
    .addEdge("ground", "__end__");

  // Initialize the MongoDB memory to persist state between graph runs
  const checkpointer = new MongoDBSaver({ client, dbName });

  // Compile the graph
  const app = workflow.compile({ checkpointer });

  // Use the Runnable
  const finalState = await app.invoke(
    {
      messages: [new HumanMessage(message)],
      predictionContext: predictionData,
      lastResponse: "",
    },
    { recursionLimit: 15, configurable: { thread_id: threadId } }
  );

  // Get the last message content
  return finalState.messages[finalState.messages.length - 1].content;
}