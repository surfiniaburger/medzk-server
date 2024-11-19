import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, DynamicRetrievalMode, HarmCategory, HarmBlockThreshold, GoogleGenerativeAIFetchError }  from "@google/generative-ai";
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
    const prompt = `
    Question
    Ground the prediction output: "${predictionOutput}" with factual information and reliable citations.
    Thought 1
    I need to systematically analyze the prediction output, breaking it down into key claims that require verification and fact-checking.
    Action 1
    <search>prediction output verification methodology</search>
    Observation 1
    Effective fact-checking requires a systematic approach of identifying specific claims, cross-referencing with multiple reliable sources, and evaluating the evidence.
    Thought 2
    I will first identify the key claims or statements within the prediction output that need factual verification.
    Action 2
    <lookup>claim identification techniques</lookup>
    Observation 2
    Carefully parse the prediction output to extract specific, verifiable statements that require factual grounding.
    Thought 3
    I will systematically search for reliable sources to confirm or contextualize each identified claim.
    Action 3
    <search>authoritative source verification</search>
    Observation 3
    Consulting peer-reviewed literature, academic publications, and reputable domain-specific sources to validate the prediction's claims.
    Thought 4
    I will critically evaluate the evidence, assessing the strength and reliability of supporting sources.
    Action 4
    <lookup>source credibility assessment</lookup>
    Observation 4
    Examining the quality of sources, looking for peer-reviewed research, expert consensus, and corroborating evidence.
    Thought 5
    I will synthesize the verified information, providing context and nuanced interpretation of the original prediction output.
    Action 5
    <search>contextual analysis techniques</search>
    Observation 5
    Integrating verified information to provide a comprehensive, well-grounded analysis of the original prediction.
    Thought 6
    I will compile the findings with appropriate citations and source attributions.
    Action 6
    <finish>Comprehensive fact-checked analysis of prediction output</finish>
    
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
    console.error("Error in Grounding function:", error);
    // Handle the error appropriately, e.g., return an error message or re-throw
    throw error; 
  }
}
