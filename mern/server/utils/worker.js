import { Worker } from 'bullmq';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import path from 'path';
import fs from 'fs';

const gkey = process.env.GEMINI_API_KEY || null;
const fileManager = new GoogleAIFileManager(gkey);

// Define the worker to process file uploads
const worker = new Worker('file-processing-queue', async (job) => {
  const { filePath, mimeType } = job.data;

  try {
    // Upload the file to Google Gemini
    const uploadResult = await fileManager.uploadFile(filePath, { mimeType });
    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);

    // Wait for the file to become active
    let currentFile = await fileManager.getFile(file.name);
    while (currentFile.state === "PROCESSING") {
      console.log("Waiting for file processing...");
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      currentFile = await fileManager.getFile(file.name);
    }

    if (currentFile.state !== "ACTIVE") {
      throw new Error(`File ${currentFile.name} failed to process.`);
    }

    console.log(`File is ready for use: ${currentFile.name}`);
  } catch (err) {
    console.error('Error processing job:', err);
  } finally {
    // Clean up the file locally after processing
    fs.unlinkSync(filePath);
  }
}, {
  connection: {
    host: 'localhost', // Redis host
    port: 6379        // Redis port
  }
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
