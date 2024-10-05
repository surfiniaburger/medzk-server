import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Converts local file information to a GoogleGenerativeAI.Part object.
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

// Turn images to Part objects
const filePart1 = fileToGenerativePart("../mern/mern/data/brain_tumor_dataset/no/1-no.jpeg", "image/jpeg")
const filePart2 = fileToGenerativePart("../mern/mern/data/brain_tumor_dataset/yes/Y1.jpg", "image/jpeg")
const filePart3 = fileToGenerativePart("../mern/mern/data/brain_tumor_dataset/yes/Y2.jpg", "image/jpeg")

async function run() {
    // Choose a Gemini model.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
    const prompt = "Analyze the provided MRI image for any anomalies or indicators of brain tumors. Identify any potential abnormalities, providing insights into possible diagnoses and relevant details from the image data.";

  
    const imageParts = [
      filePart1,
      filePart2,
      filePart3,
    ];
  
    const generatedContent = await model.generateContent([prompt, ...imageParts]);
    
    console.log(generatedContent.response.text());
  }
  
  run();