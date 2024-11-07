import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, DynamicRetrievalMode, HarmCategory, HarmBlockThreshold} from "@google/generative-ai";
import logger from '../utils/logger.js'; 
import { Storage } from '@google-cloud/storage';



// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a storage client (it will automatically use your credentials from the environment variable)
const store = new Storage();

 // Initialize Google Generative AI
 const gkey = process.env.GEMINI_API_KEY || null;
 if (!gkey) {
  logger.error('API key is not valid or not found in the config.env file');
} else {
  logger.info('API key loaded successfully:');
}
 const genAI = new GoogleGenerativeAI(gkey);
 const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002",
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

export async function Grounding(predictionOutput) {

  try {
    // Define the prompt for Gemini AI
    const prompt = `Ground the following prediction output with factual information and cite your sources: "${predictionOutput}"`;  

    // Start chat session with the model
    const chatSession = model.startChat({
      generationConfig,
      safetySettings
    });

    // Send the prompt and receive grounded response
    const generatedContent = await retryWithBackoff(() => chatSession.sendMessage(prompt));
    const groundedResponse = generatedContent.response.text();
    console.log(groundedResponse)

    return groundedResponse; 

  } catch (error) {
    console.error("Error in Grounding function:", error);
    // Handle the error appropriately, e.g., return an error message or re-throw
    throw error; 
  }
}
