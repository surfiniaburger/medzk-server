import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, DynamicRetrievalMode, HarmCategory, HarmBlockThreshold, GoogleGenerativeAIFetchError }  from "@google/generative-ai";
import logger from '../utils/logger.js'; 
import { Storage } from '@google-cloud/storage';

// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a storage client
const store = new Storage();

// Initialize Google Generative AI
const gkey = process.env.GEMINI_API_KEY || null;
if (!gkey) {
  logger.error('API key is not valid or not found in the config.env file');
} else {
  logger.info('API key loaded successfully:');
}

const genAI = new GoogleGenerativeAI(gkey);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro-002",
  tools: [
    {
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: DynamicRetrievalMode.MODE_DYNAMIC,
          dynamicThreshold: 0.7,
        },
      },
    },
  ],
},
{ apiVersion: "v1beta" },
);

const generationConfig = {
  temperature: 1,
  topK: 40,
  topP: 1,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

async function retryWithBackoff(fn, maxRetries = 3, backoffFactor = 2) {
  let retryCount = 0;
  let delay = 1000; // Initial delay of 1 second

  while (retryCount <= maxRetries) {
    try {
      return await fn(); // Attempt the API call
    } catch (error) {
      if (error instanceof GoogleGenerativeAIFetchError && error.status === 503) {
        console.warn(`Service unavailable, retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= backoffFactor; // Increase delay for next retry
        retryCount++;
      } else {
        throw error; // Re-throw other errors
      }
    }
  }
  throw new Error("Max retries exceeded.");
}

export async function GroundConversation(conversationOutput) {
  try {
    // Define the prompt for Gemini AI
    const prompt = `
    Question
    Ground the conversation output: "${conversationOutput}" with factual information and reliable citations.
    
    Thought 1
    I need to analyze the conversation output for claims, statements, and recommendations that require verification.
    Action 1
    <search>conversation analysis methodology</search>
    Observation 1
    Effective conversation grounding requires identifying key statements, understanding context, and verifying factual claims.
    
    Thought 2
    I will extract the main points and claims from the conversation that need verification.
    Action 2
    <lookup>key points extraction techniques</lookup>
    Observation 2
    Identify specific statements, recommendations, and factual claims made during the conversation.
    
    Thought 3
    I will verify each extracted point against reliable sources and expert knowledge.
    Action 3
    <search>fact verification methodology</search>
    Observation 3
    Cross-reference claims with academic sources, expert opinions, and established research.
    
    Thought 4
    I will evaluate the context and implications of the conversation.
    Action 4
    <lookup>contextual analysis in conversations</lookup>
    Observation 4
    Consider the broader context, potential implications, and real-world applications of the conversation.
    
    Thought 5
    I will provide evidence-based corrections or confirmations for each point.
    Action 5
    <search>evidence-based verification techniques</search>
    Observation 5
    Support or correct claims with concrete evidence and reliable sources.
    
    Thought 6
    I will synthesize the findings into a coherent, grounded response.
    Action 6
    <finish>Comprehensive grounded analysis of conversation output</finish>
    `;

    // Start chat session with the model
    const chatSession = model.startChat({
      generationConfig,
      safetySettings
    });

    const generatedContent = await retryWithBackoff(() => chatSession.sendMessage(prompt));
    const groundedResponse = await generatedContent.response.text();

    return groundedResponse;

  } catch (error) {
    console.error("Error in GroundConversation function:", error);
    throw error;
  }
}