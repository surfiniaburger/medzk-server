// server/routes/record.js

import express from "express";
import db from "../db/connection.js";
import { ObjectId } from "mongodb";
import { encrypt, decrypt } from "../utils/encryption.js";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as snarkjs from 'snarkjs';
import multer from "multer";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import logger from '../utils/logger.js'; 
import crypto from 'crypto';
import { body, param, validationResult } from 'express-validator'; // Import validation middleware
import vision from "@google-cloud/vision"
import { Storage } from '@google-cloud/storage';
import ffmpeg from 'fluent-ffmpeg';
import { GridFSBucket } from 'mongodb';
import { Grounding } from "../utils/grounding.js";
import { fetchAirQuality } from "../utils/air-quality.js";
import { getAddressFromCoordinates } from "../utils/address.js";
import { GoogleAICacheManager } from '@google/generative-ai/server';




// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a storage client (it will automatically use your credentials from the environment variable)
const store = new Storage();

const router = express.Router();
 // Initialize Google Generative AI
 const gkey = process.env.GEMINI_API_KEY || null;
 if (!gkey) {
  logger.error('API key is not valid or not found in the config.env file');
} else {
  logger.info('API key loaded successfully:');
}
 const genAI = new GoogleGenerativeAI(gkey);
 const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002",
 
 }

);
 const fileManager = new GoogleAIFileManager(gkey)

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

async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  logger.info(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

// Function to wait for the file to become ACTIVE
async function waitForFilesActive(file) {
  logger.info("Waiting for file processing...");
  let currentFile = await fileManager.getFile(file.name);

  while (currentFile.state === "PROCESSING") {
    try {
      process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds
      currentFile = await fileManager.getFile(file.name);
    } catch (loopError) {
      logger.error("Error during file processing:", loopError);
      // Re-throw the error to be caught by the outer catch block
      throw loopError; 
    }
  }

  if (currentFile.state !== "ACTIVE") {
    throw new Error(`File ${currentFile.name} failed to process`);
  }

  logger.info("\nFile is ready for use.");
  return currentFile;
}


const cryptoHash = (data) => {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));
  return hash.digest('hex');
};

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Use the original name; consider adding timestamp or unique identifier
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Helper function to convert file to GoogleGenerativeAI.Part
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}



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

// Health check route
router.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});


// Get all records
router.get("/", async (req, res) => {
  try {
    const collection = await db.collection("records");
    const results = await collection.find({}).toArray();
    res.status(200).json(results);
    logger.info("Fetched all records")
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get('/map', (req, res) => {
  try {
    // Log request details
    logger.info('info', 'Request received for /map');
    
    // Log environment variables
    logger.info('info', `GOOGLE_MAPS_API_KEY: ${process.env.GOOGLE_MAPS_API_KEY ? 'Loaded' : 'Not Loaded'}`);
    logger.info('info', `OPENWEATHER_API_KEY: ${process.env.OPENWEATHER_API_KEY ? 'Loaded' : 'Not Loaded'}`);
    
    // Log the keys (caution: avoid in production)
    logger.info('debug', `GOOGLE_MAPS_API_KEY Value: ${process.env.GOOGLE_MAPS_API_KEY}`);
    logger.info('debug', `OPENWEATHER_API_KEY Value: ${process.env.OPENWEATHER_API_KEY}`);
    
    // Read both files
    const htmlPath = path.join(__dirname, 'views/map.html');
    const jsPath = path.join(__dirname, '../public/js/map-application.js');
    
    logger.info('info', `Reading HTML file from: ${htmlPath}`);
    logger.info('info', `Reading JS file from: ${jsPath}`);
    
    let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const jsContent = fs.readFileSync(jsPath, 'utf-8');
    
    logger.info(htmlContent)
    logger.info(jsContent)

    // Inject the JavaScript content and API keys
    htmlContent = htmlContent
      .replace('{{GOOGLE_MAPS_API_KEY}}', process.env.GOOGLE_MAPS_API_KEY)
      .replace('{{OPENWEATHER_API_KEY}}', process.env.OPENWEATHER_API_KEY)
      .replace('<script src="/js/map-application.js"></script>', `<script>${jsContent}</script>`);
    
    logger.info('info', 'Successfully injected API keys into HTML');
    res.status(200).send(htmlContent);
  } catch (error) {
    logger.error('Error rendering the map page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single record by ID
router.get("/:id", async (req, res) => {
  try {
    const collection = await db.collection("records");
    const query = { patientId: req.params.id };
    const result = await collection.findOne(query);

    if (!result) {
      res.status(404).json({ error: "Record not found" });
    } else {
      logger.info(result)
      res.status(200).json(result);
      logger.info(result)
    }
  } catch (error) {
    console.error("Error fetching record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", 
  body('patientId').isString().notEmpty().withMessage('Patient ID is required'),
  body('recordHash').isString().notEmpty().withMessage('Record hash is required'),
  body('criteriaHash').isString().notEmpty().withMessage('Criteria hash is required'),
  body('recordData').isObject().withMessage('Record data is required'),
  // Add more specific validation for recordData fields as needed
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { patientId, recordHash, criteriaHash, recordData } = req.body;
      const encryptedRecordData = {
        name: encrypt(recordData.name),
        age: encrypt(recordData.age.toString()),
        bloodType: encrypt(recordData.bloodType),
        diagnosis: encrypt(recordData.diagnosis),
        riskScore: encrypt(recordData.riskScore.toString())
      };
      logger.info("Encrypted Record Data:", encryptedRecordData);

      const vKeyResponse = await fs.promises.readFile(
        path.join(__dirname, '../data/verification_key.json'),
        'utf-8'
      );
      const vKey = JSON.parse(vKeyResponse);

      // Hash the verification key
      const verificationKeyHash = cryptoHash(vKey);
      logger.info("Verification Key Hash:", verificationKeyHash);

      const newDocument = {
        patientId,
        recordHash,
        criteriaHash,
        verificationKeyHash, // store verification key hash instead of proof
        encryptedData: encryptedRecordData,
        createdAt: new Date()
      };

      const collection = await db.collection("records");
      const result = await collection.insertOne(newDocument);

      res.status(201).json({ message: "Record saved successfully", recordId: result.insertedId });
    } catch (err) {
      logger.error("Error adding record:", err);
      res.status(500).json({ error: "Error adding record" });
    }
  }
);

// New route for air quality and other environmental data
router.get('/location/:latitude/:longitude', async (req, res) => {
  try {
    const { latitude, longitude } = req.params;

    // 1. Fetch Air Quality Data
    const airQuality = await fetchAirQuality(latitude, longitude);

    // 2. Get Address (Reverse Geocoding) 
    const address = await getAddressFromCoordinates(latitude, longitude);


    // 3. Placeholder/Example Data for other factors (replace with actual API calls/data sources later)
    const noiseLevel = {  // Example: Replace with noise pollution data API integration
      level: Math.floor(Math.random() * 5), // 0-4 scale (0: quiet, 4: very noisy)
      description: ["Quiet", "Moderate", "Slightly Noisy", "Noisy", "Very Noisy"][Math.floor(Math.random() * 5)]
    };


    const greenSpaces = {  // Example: Replace with parks/green space data API
      proximity: Math.random() < 0.5 ? "Nearby" : "Not readily accessible", // Placeholder logic
      parks: Math.random() < 0.5 ? ["Example Park 1", "Example Park 2"] : [],
    };


    const walkabilityScore = Math.floor(Math.random() * 100); // Example walkability score (0-100)


    const publicTransport = { // Integrate with a public transport API
      availability: Math.random() < 0.7 ? "Available" : "Limited", // Placeholder
      routes:  Math.random() < 0.7 ? ["Bus Route 1", "Subway Line A"] : [], // Example routes
    };
    // 4. Combine and send the data
    res.json({
      latitude,
      longitude,
      address,
      airQuality,
      noiseLevel,
      greenSpaces,
      walkabilityScore,
      publicTransport,
      // ... any other relevant data
    });

  } catch (error) {
    console.error("Error fetching location data:", error);
    res.status(500).json({ error: "Error fetching location data" });
  }
});



// Update a record by ID
router.patch("/:id", 
  param('id').isMongoId().withMessage('Invalid record ID'),
  body('patientId').optional().isString().notEmpty(),
  body('recordHash').optional().isString().notEmpty(),
  body('criteriaHash').optional().isString().notEmpty(),
  // Add validation for 'proof' if needed
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { patientId, recordHash, criteriaHash, proof } = req.body;
      const query = { _id: new ObjectId(req.params.id) };

      const updates = {};
      if (patientId) updates.patientId = patientId;
      if (recordHash) updates.recordHash = recordHash;
      if (criteriaHash) updates.criteriaHash = criteriaHash;
      if (proof) updates.proof = proof;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const collection = await db.collection("records");
      const result = await collection.updateOne(query, { $set: updates });

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Record not found" });
      }

      res.status(200).json({ message: "Record updated successfully" });
    } catch (err) {
      logger.error("Error updating record:", err);
      res.status(500).json({ error: "Error updating record" });
    }
  }
);


// Delete a record by ID
router.delete("/:id", 
  param('id').isMongoId().withMessage('Invalid record ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const query = { _id: new ObjectId(req.params.id) };

      const collection = await db.collection("records");
      const result = await collection.deleteOne(query);

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Record not found" });
      }

      res.status(200).json({ message: "Record deleted successfully" });
    } catch (err) {
      logger.error("Error deleting record:", err);
      res.status(500).json({ error: "Error deleting record" });
    }
  }
);

async function getExistingMedicalResult(patientId) {
  try {

    if (!patientId) {
      return res.status(400).json({ error: "Missing required parameter: patientId" });
    }

    // Retrieve the record from the database based on patientId
    const collection = await db.collection("records");
    const record = await collection.findOne({ patientId });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    const { verificationKeyHash, encryptedData, criteriaHash, recordHash } = record;

    // Step 1: Load the verification key
    const vKeyResponse = await fs.promises.readFile(
      path.join(__dirname, '../data/verification_key.json'),
      'utf-8'
    );
    const vKey = JSON.parse(vKeyResponse);

    // Step 2: Hash the loaded verification key
    const vKeyHash =  cryptoHash(vKey);

    // Step 3: Compare the generated hash with the stored verificationKeyHash
    if (vKeyHash !== verificationKeyHash) {
      return res.status(400).json({ error: "Verification key hash mismatch. Aborting process." });
    }

    // Step 4: If the hash matches, load wasm and zkey files
    const wasmBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit.wasm')
    );
    const zkeyBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit_final.zkey')
    );

    // Step 5: Prepare the input to generate the proof with 0x prefix
    const input = {
      recordHash: `0x${recordHash}`,
      criteriaHash: `0x${criteriaHash}`
    };

    // Step 6: Generate proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      new Uint8Array(wasmBuffer),
      new Uint8Array(zkeyBuffer)
    );

    // Step 7: Verify the proof
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (!isValid) {
      return res.status(400).json({ error: "Proof verification failed" });
    }

    // Step 8: Check if encryptedData is an object
    if (typeof encryptedData !== 'object' || !encryptedData) {
      return res.status(400).json({ error: "Invalid encrypted data format" });
    }

    // Step 9: Decrypt each field individually
    const decryptedData = {};
    for (const field in encryptedData) {
      if (encryptedData.hasOwnProperty(field)) {
        try {
          decryptedData[field] = decrypt(encryptedData[field]);
        } catch (err) {
          return res.status(400).json({ error: `Error decrypting field: ${field}` });
        }
      }
    }

    // Step 10: Return the decrypted data and verification result
    return {
      patientId,
      recordHash,
      criteriaHash,
      decryptedData,
      isValid
    };

  } catch (error) {
    logger.error("Error retrieving and verifying record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


router.get("/search/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

   const result = await  getExistingMedicalResult(patientId)
    // Step 10: Return the decrypted data and verification result
    res.status(200).json({
      result : result
    });

  } catch (error) {
    logger.error("Error retrieving and verifying record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/image", upload.array('images', 5), 
  // Validation for image upload
  [
    body('patientId').isString().notEmpty().withMessage('Patient ID is required'),
    body('metadata').isString().notEmpty().withMessage('Metadata is required').custom(value => {
      try {
        JSON.parse(value); // Attempt to parse the metadata as JSON
        return true; // Valid JSON
      } catch (error) {
        throw new Error('Invalid JSON format for metadata'); 
      }
    }),
  ],
 
async (req, res) => {
  // Validation result check
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { patientId, metadata } = req.body;
    const images = req.files; // Array of uploaded images

    // Parse metadata
    let parsedMetadata;
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid metadata format. Must be a valid JSON string." });
    }

    // Define the prompt for Gemini AI
     const prompt = `
    Analyze this T2-weighted brain MRI for signs of multiple sclerosis. 
    Specifically, examine the white matter of the brain, particularly the periventricular regions, 
    the corpus callosum, and the optic nerves, for hyperintense lesions. 

    Provide a differential diagnosis, considering and ranking the likelihood of:
 
    * Multiple Sclerosis
    * Stroke
    * Migraine with Aura

    Estimate the number and size of any lesions detected. 
    Format your response with clear headings for each section.

    **Disclaimer:** This analysis is provided by an AI system and is intended for informational purposes only. 
    It is not a substitute for professional medical advice, diagnosis, or treatment. 
    Always consult with a qualified healthcare provider for any health concerns or before making any decisions related to your health or treatment.
    `;  // Thanks to Gemini code assist
    

    // Upload each image to Gemini for processing
    const uploadedImages = await Promise.all(
      images.map(image => uploadToGemini(image.path, image.mimetype))
    );

    // Start chat session with the model, passing the image data for analysis
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        {
          role: "user",
          parts: [
            { text: prompt },
            // Add the uploaded images to the chat session
            ...uploadedImages.map(imageFile => ({
              fileData: {
                mimeType: imageFile.mimeType,
                fileUri: imageFile.uri,
              },
            })),
          ],
        },
      ],
    });

    // Send the prompt and receive diagnostic results
    const generatedContent = await chatSession.sendMessage(prompt);
    const diagnosticResult = generatedContent.response.text();

    // Prepare data for hashing
    const imagePaths = images.map(image => image.path);
    const recordDataForHash = {
      imagePaths,
      diagnosticResult
    };

    // Generate recordHash
    const recordHash =  cryptoHash(recordDataForHash);

    // Generate criteriaHash from metadata
    const criteriaHash =  cryptoHash(parsedMetadata);

    // Encrypt diagnosticResult
    const encryptedDiagnosticResult = encrypt(diagnosticResult);

    // Read and hash verification key
    const vKeyResponse = await fs.promises.readFile(
      path.join(__dirname, '../data/verification_key.json'),
      'utf-8'
    );
    const vKey = JSON.parse(vKeyResponse);

    // Hash the verification key
    const verificationKeyHash =  cryptoHash(vKey);

    // Prepare the new document to be inserted into the database
    const newDocument = {
      patientId,
      criteriaHash,
      recordHash,
      verificationKeyHash,
      encryptedDiagnosticResult,
      createdAt: new Date()
    };

    // Insert the new document into the "image-records" collection
    const collection = await db.collection("image-records");
    const result = await collection.insertOne(newDocument);

    res.status(201).json({
      message: "Image record created successfully",
      recordId: result.insertedId,
      // Optionally omit returning encryptedDiagnosticResult to the client
    });
  } catch (error) {
    logger.error("Error creating image record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


async function getExistingImageAnalysisResult(patientId) {
  try {
    if (!patientId) {
      return res.status(400).json({ error: "Missing required parameter: patientId" });
    }
    console.log("I've passed the vlidation test")

    // Retrieve the record from the database based on patientId
    const collection = await db.collection("image-records");
    const record = await collection.findOne({ patientId });

    if (!record) {
      return res.status(404).json({ error: "Image record not found" });
    }

    const { verificationKeyHash, encryptedDiagnosticResult, criteriaHash, recordHash } = record;

    // Step 1: Load the verification key
    const vKeyResponse = await fs.promises.readFile(
      path.join(__dirname, '../data/verification_key.json'),
      'utf-8'
    );
    const vKey = JSON.parse(vKeyResponse);

    // Step 2: Hash the loaded verification key
    const vKeyHash =  cryptoHash(vKey);

    // Step 3: Compare the generated hash with the stored verificationKeyHash
    if (vKeyHash !== verificationKeyHash) {
      return res.status(400).json({ error: "Verification key hash mismatch. Aborting process." });
    }

    // Step 4: Load wasm and zkey files
    const wasmBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit.wasm')
    );
    const zkeyBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit_final.zkey')
    );

    // Step 5: Prepare the input to generate the proof with 0x prefix
    const input = {
      recordHash: `0x${recordHash}`,
      criteriaHash: `0x${criteriaHash}`
    };

    // Step 6: Generate proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      new Uint8Array(wasmBuffer),
      new Uint8Array(zkeyBuffer)
    );

    // Step 7: Verify the proof
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (!isValid) {
      return res.status(400).json({ error: "Proof verification failed" });
    }

    // Step 8: Decrypt diagnostic result
    let decryptedDiagnosticResult;
    try {
      decryptedDiagnosticResult = decrypt(encryptedDiagnosticResult);
    } catch (decryptError) {
      return res.status(400).json({ error: "Error decrypting diagnostic results" });
    }

    // Step 9: Return the decrypted data and verification result
    return {
      patientId,
      recordHash,
      criteriaHash,
      diagnosticResult: decryptedDiagnosticResult,
      isValid
    };

  } catch (error) {
    return { error: "Internal server error" };
  }
};

router.get("/image/search/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ error: "Missing required parameter: patientId" });
    }

    // Retrieve the record from the database based on patientId
    const collection = await db.collection("image-records");
    const record = await collection.findOne({ patientId });

    if (!record) {
      return res.status(404).json({ error: "Image record not found" });
    }

    const { verificationKeyHash, encryptedDiagnosticResult, criteriaHash, recordHash } = record;

    // Step 1: Load the verification key
    const vKeyResponse = await fs.promises.readFile(
      path.join(__dirname, '../data/verification_key.json'),
      'utf-8'
    );
    const vKey = JSON.parse(vKeyResponse);

    // Step 2: Hash the loaded verification key
    const vKeyHash =  cryptoHash(vKey);

    // Step 3: Compare the generated hash with the stored verificationKeyHash
    if (vKeyHash !== verificationKeyHash) {
      return res.status(400).json({ error: "Verification key hash mismatch. Aborting process." });
    }

    // Step 4: Load wasm and zkey files
    const wasmBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit.wasm')
    );
    const zkeyBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit_final.zkey')
    );

    // Step 5: Prepare the input to generate the proof with 0x prefix
    const input = {
      recordHash: `0x${recordHash}`,
      criteriaHash: `0x${criteriaHash}`
    };

    // Step 6: Generate proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      new Uint8Array(wasmBuffer),
      new Uint8Array(zkeyBuffer)
    );

    // Step 7: Verify the proof
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (!isValid) {
      return res.status(400).json({ error: "Proof verification failed" });
    }

    // Step 8: Decrypt diagnostic result
    let decryptedDiagnosticResult;
    try {
      decryptedDiagnosticResult = decrypt(encryptedDiagnosticResult);
    } catch (decryptError) {
      return res.status(400).json({ error: "Error decrypting diagnostic results" });
    }

    // Step 9: Return the decrypted data and verification result
    res.status(200).json({
      patientId,
      recordHash,
      criteriaHash,
      diagnosticResult: decryptedDiagnosticResult,
      isValid
    });

    
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/video", upload.single('video'),
   // Validation for video upload
  [
    body('patientId').isString().notEmpty().withMessage('Patient ID is required'),
    body('metadata').isString().notEmpty().withMessage('Metadata is required').custom(value => {
      try {
        JSON.parse(value); // Attempt to parse the metadata as JSON
        return true; // Valid JSON
      } catch (error) {
        throw new Error('Invalid JSON format for metadata'); 
      }
    }),
  ],

async (req, res) => {
  // Validation result check
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { patientId, metadata } = req.body;
    const video = req.file; // The uploaded video

    // Parse metadata
    let parsedMetadata;
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid metadata format. Must be a valid JSON string." });
    }

    // Define the prompt for Gemini AI
    const prompt = `
      Carefully analyze the provided video footage for any healthcare-related abnormalities. Specifically, look for signs of potential physical ailments, mobility issues, or behavioral anomalies. Your analysis should cover:
      1. A comprehensive review of any visible medical symptoms and their significance.
      2. Differential diagnoses based on observed clinical indicators.
      3. Suggestions for appropriate follow-up tests or imaging studies.
      4. Insights into the urgency of medical intervention, if applicable, and potential care pathways.
      Structure your response with clear headings for each section, and ensure that your analysis is thorough and evidence-based.

      **Disclaimer:** This analysis is provided by an AI system and is intended for informational purposes only. 
      It is not a substitute for professional medical advice, diagnosis, or treatment. 
      Always consult with a qualified healthcare provider for any health concerns or before making any decisions related to your health or treatment.
    `;


    // Upload the video to Gemini for processing
    const uploadedVideo = await uploadToGemini(video.path, video.mimetype);

    // Wait for the file to become ACTIVE
    const activeFile = await waitForFilesActive(uploadedVideo);

    // Proceed with further processing once the file is ACTIVE
    logger.info("File is ready:", activeFile);

    // Start chat session with the model, passing the video for analysis
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              fileData: {
                mimeType: activeFile.mimeType,
                fileUri: activeFile.uri,
              },
            },
          ],
        },
      ],
    });

    // Send the prompt and receive diagnostic results
    const generatedContent = await chatSession.sendMessage(prompt);
    const diagnosticResult = generatedContent.response.text();

    // Prepare data for hashing
    const recordDataForHash = {
      videoPath: video.path,
      diagnosticResult,
    };

    // Generate recordHash
    const recordHash =  cryptoHash(recordDataForHash);

    // Generate criteriaHash from metadata
    const criteriaHash =  cryptoHash(parsedMetadata);

    // Encrypt diagnosticResult
    const encryptedDiagnosticResult = encrypt(diagnosticResult);

    // Read and hash verification key
    const vKeyResponse = await fs.promises.readFile(
      path.join(__dirname, '../data/verification_key.json'),
      'utf-8'
    );
    const vKey = JSON.parse(vKeyResponse);

    // Hash the verification key
    const verificationKeyHash =  cryptoHash(vKey);

    // Prepare the new document to be inserted into the database
    const newDocument = {
      patientId,
      criteriaHash,
      recordHash,
      verificationKeyHash,
      encryptedDiagnosticResult,
      createdAt: new Date(),
    };

    // Insert the new document into the "video-records" collection
    const collection = await db.collection("video-records");
    const result = await collection.insertOne(newDocument);

    res.status(201).json({
      message: "Video record created successfully",
      recordId: result.insertedId,
    });
  } catch (error) {
    logger.error("Error creating video record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



async function getExistingVideoAnalysisResult(patientId) {
  try {

    if (!patientId) {
      return res.status(400).json({ error: "Missing required parameter: patientId" });
    }

    // Retrieve the record from the database based on patientId
    const collection = await db.collection("video-records");
    const record = await collection.findOne({ patientId });

    if (!record) {
      return res.status(404).json({ error: "Video record not found" });
    }

    const { verificationKeyHash, encryptedDiagnosticResult, criteriaHash, recordHash } = record;

    // Step 1: Load the verification key
    const vKeyResponse = await fs.promises.readFile(
      path.join(__dirname, '../data/verification_key.json'),
      'utf-8'
    );
    const vKey = JSON.parse(vKeyResponse);

    // Step 2: Hash the loaded verification key
    const vKeyHash =  cryptoHash(vKey);

    // Step 3: Compare the generated hash with the stored verificationKeyHash
    if (vKeyHash !== verificationKeyHash) {
      return res.status(400).json({ error: "Verification key hash mismatch. Aborting process." });
    }

    // Step 4: Load wasm and zkey files
    const wasmBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit.wasm')
    );
    const zkeyBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit_final.zkey')
    );

    // Step 5: Prepare the input to generate the proof with 0x prefix
    const input = {
      recordHash: `0x${recordHash}`,
      criteriaHash: `0x${criteriaHash}`,
    };

    // Step 6: Generate proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      new Uint8Array(wasmBuffer),
      new Uint8Array(zkeyBuffer)
    );

    // Step 7: Verify the proof
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (!isValid) {
      return res.status(400).json({ error: "Proof verification failed" });
    }

    // Step 8: Decrypt diagnostic result
    let decryptedDiagnosticResult;
    try {
      decryptedDiagnosticResult = decrypt(encryptedDiagnosticResult);
    } catch (decryptError) {
      return res.status(400).json({ error: "Error decrypting diagnostic results" });
    }

    // Step 9: Return the decrypted data and verification result
    return {
      patientId,
      recordHash,
      criteriaHash,
      diagnosticResult: decryptedDiagnosticResult,
      isValid,
    };
  } catch (error) {
    return { error: "Internal server error" };
  }
};


router.get("/video/search/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!patientId) {
      return res.status(400).json({ error: "Missing required parameter: patientId" });
    }

    // Retrieve the record from the database based on patientId
    const collection = await db.collection("video-records");
    const record = await collection.findOne({ patientId });

    if (!record) {
      return res.status(404).json({ error: "Video record not found" });
    }

    const { verificationKeyHash, encryptedDiagnosticResult, criteriaHash, recordHash } = record;

    // Step 1: Load the verification key
    const vKeyResponse = await fs.promises.readFile(
      path.join(__dirname, '../data/verification_key.json'),
      'utf-8'
    );
    const vKey = JSON.parse(vKeyResponse);

    // Step 2: Hash the loaded verification key
    const vKeyHash =  cryptoHash(vKey);

    // Step 3: Compare the generated hash with the stored verificationKeyHash
    if (vKeyHash !== verificationKeyHash) {
      return res.status(400).json({ error: "Verification key hash mismatch. Aborting process." });
    }

    // Step 4: Load wasm and zkey files
    const wasmBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit.wasm')
    );
    const zkeyBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit_final.zkey')
    );

    // Step 5: Prepare the input to generate the proof with 0x prefix
    const input = {
      recordHash: `0x${recordHash}`,
      criteriaHash: `0x${criteriaHash}`,
    };

    // Step 6: Generate proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      new Uint8Array(wasmBuffer),
      new Uint8Array(zkeyBuffer)
    );

    // Step 7: Verify the proof
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (!isValid) {
      return res.status(400).json({ error: "Proof verification failed" });
    }

    // Step 8: Decrypt diagnostic result
    let decryptedDiagnosticResult;
    try {
      decryptedDiagnosticResult = decrypt(encryptedDiagnosticResult);
    } catch (decryptError) {
      return res.status(400).json({ error: "Error decrypting diagnostic results" });
    }

    // Step 9: Return the decrypted data and verification result
    res.status(200).json({
      patientId,
      recordHash,
      criteriaHash,
      diagnosticResult: decryptedDiagnosticResult,
      isValid,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// server/routes/record.js 

// ... (Your existing imports, constants, and helper functions)

// ... (Your existing routes)

// *** Image Upload Route ***
router.post("/upload/image", upload.array('images', 5), 
  // Validation for image upload
  [
    body('patientId').isString().notEmpty().withMessage('Patient ID is required'),
  ],
  async (req, res) => {
    // Validation result check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { patientId } = req.body;
      const images = req.files; 

      // Read image data as Buffer and store in an array
      const imageDataArray = images.map(image => ({
        data: fs.readFileSync(image.path),
        createdAt: new Date() // Add timestamp
      }));

      


      // Define the prompt for Gemini AI
     const prompt = `
     Analyze the provided image to identify potential social determinants of health (SDOH) factors that could affect the health of a pregnant woman living in this environment.
 
          Consider the following aspects:
            - **Neighborhood Safety:** Are there any visible signs of crime or violence (e.g., graffiti, broken windows, security bars)? Does the environment appear safe for walking or outdoor activities?
            - **Access to Healthy Food:** Are there grocery stores, farmers' markets, or healthy food options visible in the image? Or are there more fast food restaurants or convenience stores?
            - **Housing Quality:** What is the condition of the housing in the image? Are there any signs of disrepair, overcrowding, or inadequate sanitation?
            - **Environmental Hazards:** Are there any visible environmental hazards, such as pollution, industrial sites, or lack of green spaces?
            - **Transportation:** Are there public transportation options visible? Does the area appear walkable or bike-friendly?
            - **Social Cohesion:** Does the environment suggest a sense of community (e.g., people interacting, community centers)?

          Provide a concise summary of your observations and highlight any potential SDOH risks or protective factors that could impact the health of a pregnant woman living in this environment.

          **Disclaimer:** This analysis is provided by an AI system and is intended for informational purposes only. It is not a substitute for professional assessment of social determinants of health.
     `;  // Thanks to Gemini code assist


     
 
     // Upload each image to Gemini for processing
     const uploadedImages = await Promise.all(
       images.map(image => uploadToGemini(image.path, image.mimetype))
     );
 
     // Start chat session with the model, passing the image data for analysis
     const chatSession = model.startChat({
       generationConfig,
       safetySettings,
       history: [
         {
           role: "user",
           parts: [
             { text: prompt },
             // Add the uploaded images to the chat session
             ...uploadedImages.map(imageFile => ({
               fileData: {
                 mimeType: imageFile.mimeType,
                 fileUri: imageFile.uri,
               },
             })),
           ],
         },
       ],
     });

     // Prepare the new document to be inserted into the database
     const newDocument = {
      patientId,
      // ... other fields ...
      imageDataArray, // Store the array of image data
      createdAt: new Date()
    };

    // Insert the new document into the "image-records" collection
    const collection = await db.collection("image-sdoh-records");
    await collection.insertOne(newDocument);

    
    await collection.updateOne(
      { patientId }, // Find the document by patientId
      { $push: { imageDataArray: { $each: imageDataArray } } } // Append new image data to the array
    );

    
    
    // Perform SDOH analysis for each image
    const sdohInsightsArray = await analyzeSDOHData(patientId);
 
     // Send the prompt and receive diagnostic results
     const generatedContent = await retryWithBackoff(() => chatSession.sendMessage(prompt));
     const geminiInsights = generatedContent.response.text();
      console.log(geminiInsights)
      console.log(sdohInsightsArray)

      // Store image URIs (or other relevant data) in your database
      // ... (Logic to associate image URIs with the patientId)

      res.status(201).json({
        message: "image uploaded successfully",
        geminiInsights: geminiInsights,
        sdohInsights: sdohInsightsArray,
      });

    } catch (error) {
      logger.error("Error uploading images:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);




// *** Video Upload Route ***
router.post("/upload/video", upload.single('video'),
  // Validation for video upload
  [
    body('patientId').isString().notEmpty().withMessage('Patient ID is required'),
  ],
  async (req, res) => {
    // Validation result check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { patientId } = req.body;
      const video = req.file;

      //  Check if there's an existing record for this patient
      const existingRecord = await db.collection("video-sdoh-records").findOne({ patientId });
      
      //  If exists, delete the old video from GridFS
      if (existingRecord) {
        const bucket = new GridFSBucket(db, { bucketName: 'videos' });
        try {
          await bucket.delete(existingRecord.uploadedVideoId);
        } catch (deleteError) {
          console.warn(`Failed to delete old video: ${deleteError.message}`);
          // Continue with upload even if delete fails
        }
      }

      // 1. Create a GridFS bucket
      const bucket = new GridFSBucket(db, { bucketName: 'videos' });

      // 2. Create an upload stream
      const uploadStream = bucket.openUploadStream(video.originalname, {
        metadata: { 
          patientId,
          uploadDate: new Date(),
          originalName: video.originalname,
          mimeType: video.mimetype 
        }
      });

      // 3. Pipe the video data to the upload stream
      fs.createReadStream(video.path).pipe(uploadStream)
        .on('error', (error) => {
          logger.error("Error uploading video to GridFS:", error);
          res.status(500).json({ error: "Internal server error" });
        })
        .on('finish', async () => {
          // 4. Get the video file ID from GridFS
          const videoFileId = uploadStream.id; 

          // 5. Update or create the video record
            await db.collection("video-sdoh-records").updateOne(
             { patientId },
           { 
           $set: {
            uploadedVideoId: videoFileId,
            lastUpdated: new Date(),
            originalName: video.originalname,
            mimeType: video.mimetype
            }
           },
           { upsert: true }
           );

          // Delete any old analysis results
              await db.collection("sdoh-analysis-results").deleteMany({ patientId });

          // 6. Upload the video to Gemini for processing
          const uploadedVideo = await uploadToGemini(video.path, video.mimetype);

          // 7. Wait for the file to become ACTIVE
          const activeFile = await waitForFilesActive(uploadedVideo);

          // *** Caching Logic Start ***
          const cacheManager = new GoogleAICacheManager(gkey);
          const displayName = `video-analysis-${patientId}`; // Unique name for the cache
          const modelName = 'models/gemini-1.5-pro-001'; // Your Gemini model
          let ttlSeconds = 24 * 3600; // Cache TTL (24 hour in this example)

          // Create a cache key. This should be unique for each video.
          const cacheKey = `video-analysis-${videoFileId}`; 

          // Try to fetch from cache first
          let cachedContent = null;
          try {
            cachedContent = await cacheManager.get(cacheKey);
            console.log("cached content" + cacheKey + "   " + cachedContent)
            console.log(displayName)
          } catch (err) {
            console.log(displayName)
            // Handle cache miss (e.g., cache not found)
            console.log('Cache miss:', err.message); 
          }

          if (cachedContent) {
            // Use the cached content
            console.log('Using cached content');
            const { geminiAnalysis, sdohVideoInsightsArray } = cachedContent; 

            res.status(201).json({
              message: "Video analysis retrieved from cache",
              uploadedVideoUrl: activeFile.uri,
              geminiAnalysis: geminiAnalysis,
              sdohVideoInsightsArray: sdohVideoInsightsArray,
              uploadedVideoId: videoFileId,
            });

          } else {
            console.log('Cache miss - performing analysis');

            // 8. Define the prompt for Gemini AI 
            const prompt = `
              Analyze the provided video in the context of pregnancy care. 
              Focus on identifying any potential issues or abnormalities that could affect the health of the mother or the fetus.

              Specifically, look for:
              - **Maternal Physical Health:** Assess the mother's posture, gait, and any visible signs of discomfort or distress.
              - **Fetal Movement:** Observe fetal movements and note if they appear normal, reduced, or excessive.
              - **Environmental Factors:** Analyze the environment shown in the video for potential hazards or risks to the mother or fetus (e.g., unsafe conditions, lack of support).

              Provide a concise summary of your findings and highlight any areas of concern.

              **Disclaimer:** This analysis is provided by an AI system and is intended for informational purposes only. 
              It is not a substitute for professional medical advice, diagnosis, or treatment. 
              Always consult with a qualified healthcare provider for any health concerns or before making any decisions related to your health or treatment.
            `;

            // 9. Start chat session with the model
            const chatSession = model.startChat({
              generationConfig,
              safetySettings,
              history: [
                {
                  role: "user",
                  parts: [
                    { text: prompt },
                    {
                      fileData: {
                        mimeType: activeFile.mimeType,
                        fileUri: activeFile.uri,
                      },
                    },
                  ],
                },
              ],
            });

            // 10. Send the prompt and receive diagnostic results
            const generatedContent = await retryWithBackoff(() => chatSession.sendMessage(prompt));
            const geminiAnalysis = generatedContent.response.text();
            console.log(geminiAnalysis)

            // 11. Perform SDOH analysis for the video
            const { accumulatedInsights, tempVideoPath } = await analyzeSDOHDataForVideo(patientId);

            // Cache the response for future use
            try {
              const cacheContent = {
                geminiAnalysis: geminiAnalysis,
                sdohVideoInsightsArray: accumulatedInsights,
              };

              const cache = await cacheManager.create({
                model: modelName,
                displayName: cacheKey, // Use the cache key here
                systemInstruction: { // Provide a valid Content object
                  role: 'system', // Set the role to 'system'
                  parts: [{ text: '' }], // You can keep the text empty
                }, // You can leave this empty if not needed
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: prompt }], 
                  },
                  {
                    role: 'assistant',
                    parts: [
                      {text: cacheContent.geminiAnalysis }, // Directly cache geminiAnalysis
                      {text: JSON.stringify(cacheContent.sdohVideoInsightsArray) } // Cache the entire object as a string
                    ], // Cache the analysis results
                  },
                ],
                ttlSeconds,
              });
              console.log('Response cached successfully:', cache.name);
            } catch (cacheError) {
              console.error('Error caching response:', cacheError);
              // Handle caching errors (e.g., log the error)
            }

            res.status(201).json({
              message: "Video record created successfully",
              uploadedVideoUrl: activeFile.uri,
              geminiAnalysis: geminiAnalysis,
              sdohVideoInsightsArray: accumulatedInsights,
              uploadedVideoId: videoFileId,
            });
          }
          // *** Caching Logic End ***

        }); // End of uploadStream.on('finish') 

    } catch (error) {
      logger.error("Error uploading video:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);


// Fixed extractFramesFromVideo function
async function extractFramesFromVideo(videoPath, numFrames = 5) {
  try {
    // 1. Create the temp directory for frames if it doesn't exist
    const framesDir = path.join(process.cwd(), 'temp', 'frames');
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    // 2. Clean up any existing frames
    fs.readdirSync(framesDir)
      .filter(file => file.startsWith('frame-'))
      .forEach(file => fs.unlinkSync(path.join(framesDir, file)));

    // 3. Create a promise to handle frame extraction
    return new Promise((resolve, reject) => {
      const frameFileNames = [];
      let frameCount = 0;

      ffmpeg(videoPath)
        .on('filenames', (filenames) => {
          frameFileNames.push(...filenames.map(filename => 
            path.join(framesDir, filename)
          ));
        })
        .on('end', () => {
          // Verify frames were actually created
          const existingFrames = frameFileNames.filter(frame => 
            fs.existsSync(frame)
          );
          
          if (existingFrames.length === 0) {
            reject(new Error('No frames were extracted from the video'));
          } else {
            resolve(existingFrames);
          }
        })
        .on('error', (err) => reject(err))
        .screenshots({
          count: numFrames,
          folder: framesDir,
          filename: `frame-%i.png`,
          size: '1280x720'  // Set a consistent size
        });
    });
  } catch (error) {
    console.error('Error extracting frames from video:', error);
    throw error;
  }
}


const visionClient = new vision.ImageAnnotatorClient();
async function analyzeSDOHDataForVideoFrame(framePath, previousInsights = {}) {
  try {
    // 1. Call Google Vision API 
    const [result] = await visionClient.annotateImage({
      image: { source: { filename: framePath } },
      features: [
        { type: 'LABEL_DETECTION' },
        { type: 'OBJECT_LOCALIZATION' },
      ],
    });

    const labels = result.labelAnnotations;
    const objects = result.localizedObjectAnnotations;

    // 2. Analyze labels and objects for SDOH insights
    let sdohInsights = { ...previousInsights };

    // Log detected items
    console.log('\n--- Frame Analysis Results ---');
    console.log('Detected Labels:', labels.map(l => `${l.description} (${(l.score * 100).toFixed(1)}%)`));
    console.log('Detected Objects:', objects.map(o => `${o.name} (${(o.score * 100).toFixed(1)}%)`));

    // Analyze labels
    for (const label of labels) {
      const labelDesc = label.description.toLowerCase();
      
      // Safety analysis
      if (labelDesc.includes("graffiti") || labelDesc.includes("broken window")) {
        sdohInsights.neighborhoodSafety = (sdohInsights.neighborhoodSafety || 0) - 1;
        console.log(`⚠️ Safety Concern: Detected ${label.description}`);
      }
      
      // Food access analysis
      if (labelDesc.includes("fast food") || labelDesc.includes("convenience store")) {
        sdohInsights.healthyFoodAccess = (sdohInsights.healthyFoodAccess || 0) - 1;
        console.log(`🍔 Limited Food Access: Detected ${label.description}`);
      }
      if (labelDesc.includes("grocery store") || labelDesc.includes("farmers market")) {
        sdohInsights.healthyFoodAccess = (sdohInsights.healthyFoodAccess || 0) + 1;
        console.log(`🥬 Healthy Food Access: Detected ${label.description}`);
      }
      
      // Transportation access
      if (labelDesc.includes("bus stop") || labelDesc.includes("train station")) {
        sdohInsights.transportationAccess = (sdohInsights.transportationAccess || 0) + 1;
        console.log(`🚌 Transportation Access: Detected ${label.description}`);
      }
      
      // Healthcare access
      if (labelDesc.includes("hospital") || labelDesc.includes("clinic")) {
        sdohInsights.healthcareAccess = (sdohInsights.healthcareAccess || 0) + 1;
        console.log(`🏥 Healthcare Access: Detected ${label.description}`);
      }
    }

    // Analyze objects for mobility
    for (const object of objects) {
      if (object.name === "Person" && object.score > 0.8) {
        sdohInsights.mobility = (sdohInsights.mobility || 0) + 1;
        console.log(`👤 Mobility Analysis: Detected person with ${(object.score * 100).toFixed(1)}% confidence`);
      }
    }

    // Print frame analysis summary
    console.log('\n--- Frame SDOH Insights Summary ---');
    Object.entries(sdohInsights).forEach(([category, score]) => {
      console.log(`${category}: ${score}`);
    });
    console.log('--------------------------------\n');

    return sdohInsights;

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Frame not found: ${framePath}`);
      return { error: `Frame not found: ${framePath}` };
    }
    console.error("Error analyzing SDOH data for video frame:", error);
    throw error;
  }
}


// Add these helper functions BEFORE analyzeSDOHDataForVideo function

// Helper function to calculate overall SDOH score
function calculateOverallScore(insights) {
  // If insights is empty or undefined, return 0
  if (!insights || Object.keys(insights).length === 0) {
    return 0;
  }

  const weights = {
    neighborhoodSafety: 0.25,
    healthyFoodAccess: 0.2,
    transportationAccess: 0.2,
    healthcareAccess: 0.25,
    mobility: 0.1
  };

  let totalScore = 0;
  let weightSum = 0;

  Object.entries(insights).forEach(([category, value]) => {
    if (weights[category]) {
      totalScore += (value || 0) * weights[category];
      weightSum += weights[category];
    }
  });

  return weightSum > 0 ? Number((totalScore / weightSum).toFixed(2)) : 0;
}

// Helper function to format SDOH categories
function formatSDOHCategories(insights) {
  // If insights is empty or undefined, return empty object
  if (!insights || Object.keys(insights).length === 0) {
    return {};
  }

  const categories = {};
  
  Object.entries(insights).forEach(([category, score]) => {
    categories[category] = {
      score: score || 0,
      impact: score > 0 ? 'Positive' : score < 0 ? 'Negative' : 'Neutral'
    };
  });

  return categories;
}

// Helper function to generate recommendations
function generateRecommendations(insights) {
  // If insights is empty or undefined, return empty array
  if (!insights || Object.keys(insights).length === 0) {
    return [];
  }

  const recommendations = [];

  if ((insights.neighborhoodSafety || 0) < 0) {
    recommendations.push('Consider safety assessment and community resource connection');
  }
  if ((insights.healthyFoodAccess || 0) < 0) {
    recommendations.push('Provide information about local food assistance programs and healthy food resources');
  }
  if ((insights.transportationAccess || 0) < 0) {
    recommendations.push('Connect with transportation assistance services');
  }
  if ((insights.healthcareAccess || 0) < 0) {
    recommendations.push('Facilitate connections with nearby healthcare providers');
  }
  if ((insights.mobility || 0) < 0) {
    recommendations.push('Consider mobility assessment and support services');
  }

  // If no specific recommendations, provide a default one
  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring SDOH factors');
  }

  return recommendations;
}


async function analyzeSDOHDataForVideo(patientId) {
  let tempVideoPath = null;
  let frames = [];
  
  try {
    // 1. Get the video file ID from database 
    const videoRecord = await db.collection("video-sdoh-records").findOne({ patientId }, { sort: { lastUpdated: -1 } });
    if (!videoRecord) {
      throw new Error(`No video record found for patient ID: ${patientId}`);
    }

    const videoFileId = videoRecord.uploadedVideoId;

    // Verify the video exists in GridFS
    const bucket = new GridFSBucket(db, { bucketName: 'videos' });
    const videoFiles = await bucket.find({ _id: videoFileId }).toArray();
    
    if (videoFiles.length === 0) {
      throw new Error(`Video file not found in GridFS: ${videoFileId}`);
    }
    
    // 2. Create temporary directory
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 3. Set up temporary video path
    tempVideoPath = path.join(tempDir, `${Date.now()}-temp-video.mp4`);
    
    // 4. Download and process video
    await new Promise((resolve, reject) => {
      const bucket = new GridFSBucket(db, { bucketName: 'videos' });
      const downloadStream = bucket.openDownloadStream(videoFileId);
      const writeStream = fs.createWriteStream(tempVideoPath);

      downloadStream
        .pipe(writeStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    console.log("Video downloaded successfully to:", tempVideoPath);

    // 5. Extract frames
    frames = await extractFramesFromVideo(tempVideoPath);
    console.log("Frames extracted successfully:", frames);

    // 6. Initialize analysis containers
     // Initialize insights tracking with default values
     let accumulatedInsights = {
      neighborhoodSafety: 0,
      healthyFoodAccess: 0,
      transportationAccess: 0,
      healthcareAccess: 0,
      mobility: 0
    };
    let frameAnalyses = [];

    // 7. Analyze each frame
    for (const [index, framePath] of frames.entries()) {
      try {
        console.log(`\n=== Processing Frame ${index + 1}/${frames.length} ===`);
        if (!fs.existsSync(framePath)) {
          console.warn(`Skipping missing frame: ${framePath}`);
          continue;
        }

        const frameInsights = await analyzeSDOHDataForVideoFrame(framePath, accumulatedInsights);
        frameAnalyses.push({
          frameNumber: index + 1,
          insights: frameInsights
        });

        accumulatedInsights = { ...accumulatedInsights, ...frameInsights };
      } catch (frameError) {
        console.error(`❌ Error analyzing frame ${index + 1}:`, frameError);
      }
    }

    // 8. Generate SDOH summary
    const sdohSummary = {
      overallScore: calculateOverallScore(accumulatedInsights),
      categories: formatSDOHCategories(accumulatedInsights),
      recommendations: generateRecommendations(accumulatedInsights)
    };

    // Print final analysis results
    console.log('\n========================================');
    console.log('🏥 FINAL SDOH ANALYSIS RESULTS 🏥');
    console.log('========================================');
    console.log('\n📊 Overall SDOH Score:', sdohSummary.overallScore);
    
    console.log('\n📋 Category Breakdown:');
    Object.entries(sdohSummary.categories).forEach(([category, details]) => {
      console.log(`\n${category}:`);
      console.log(`  Score: ${details.score}`);
      console.log(`  Impact: ${details.impact}`);
    });

    console.log('\n💡 Recommendations:');
    sdohSummary.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('\n========================================\n');

    // 9. Store analysis results
    const analysisRecord = {
      patientId,
      timestamp: new Date(),
      sdohSummary,
      frameAnalyses,
      rawInsights: accumulatedInsights
    };

    await db.collection("sdoh-analysis-results").insertOne(analysisRecord);
    console.log(`✅ Analysis results saved to database for patient ${patientId}`);

    return {
      accumulatedInsights,
      tempVideoPath,
      sdohSummary,
      analysisId: analysisRecord._id
    };

  } catch (error) {
    console.error('❌ Error in SDOH video analysis:', error);
    throw error;
  } finally {
    // Cleanup
    try {
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      frames.forEach(frame => {
        if (fs.existsSync(frame)) {
          fs.unlinkSync(frame);
        }
      });
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
}

// Route to get predictions and recommendations
router.post("/predict", async (req, res) => {
  try {
    const { patientId, uploadedImageUrls, uploadedVideoUrl, wellnessText, latitude, longitude,  sdohInsight, geminiInsights, geminiAnalysis, sdohVideoInsightsArray } = req.body;
    logger.info('Received request for patientId:', patientId);
    

    // 1. Data Gathering & Enrichment:

    const [existingRecord, extractedMedicalHistory, existingImageAnalysis, existingVideoAnalysis] = await Promise.all([
      db.collection("records").findOne({ patientId }),
      getExistingMedicalResult(patientId),
      getExistingImageAnalysisResult(patientId),
      getExistingVideoAnalysisResult(patientId),
    ]);


    console.log(existingImageAnalysis)
    console.log(existingVideoAnalysis)
    console.log("Location of the patient")
    console.log(longitude)
    console.log(latitude)
    console.log(extractedMedicalHistory)

    const combinedAnalysis = await combineAnalysisResults(existingImageAnalysis, existingVideoAnalysis)
    console.log(combinedAnalysis)


    // air quality data are not yet available in some region, we are using a default co-ordinate
     const airQualityData = await fetchAirQuality().catch(err => {
      logger.error('Air Quality Fetch Error:', err);
      return null;
    });

    const address = await getAddressFromCoordinates(latitude, longitude).catch(err => {
      logger.error('Air Quality Fetch Error:', err);
      return null;
    });
    
     const combinedSDOHInsights = {
      image: {
        visionAPI: sdohInsight || "No image SDOH insights from Vision API available.",
        gemini: geminiInsights || "No image SDOH insights from Gemini available."
      },
      video: {
        visionAPI: sdohVideoInsightsArray || "No video SDOH insights from Vision API available.",
        gemini: geminiAnalysis || "No video SDOH insights from Gemini available."
      }
    };
    

    // 2. Gemini Multimodal Analysis:
    const prompt = `
      Patient: ${patientId}
      wellnessText: ${wellnessText}
      Medical History: ${JSON.stringify(extractedMedicalHistory)}
      SDOH Insights: ${JSON.stringify(combinedSDOHInsights)}
      Air Quality Data: ${JSON.stringify(airQualityData)}
      Patient Address: ${address}
      Image/Video Analysis: ${combinedAnalysis}

      Based on this information, provide a personalized risk assessment for:
        - Diabetes
        - Heart Disease
        - ... (other relevant conditions)

      Include specific recommendations for preventative measures, considering the patient's context.
      Explain your reasoning for each risk assessment and recommendation.
    `;

    const chatSession = model.startChat({ 
      generationConfig,
      safetySettings 
    });
    const response = await chatSession.sendMessage(prompt);
    const predictionOutput = response.response.text(); // Get text output from Gemini
    console.log(predictionOutput)

    // 3. Process & Return Results:
    //   - Extract risk scores and recommendations from Gemini's response
   
    const groundedPredictionOutput = await Grounding(predictionOutput)
    // const riskAssessments = await processGeminiPrediction(groundedPredictionOutput );
    
   // const webSearchQueries = groundedPredictionOutput.groundingMetadata?.webSearchQueries || [];

    res.status(200).json({ 
        groundedPredictionOutput, 
    });

  } catch (error) {
    logger.error("Error generating prediction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function combineAnalysisResults(imageAnalysis, videoAnalysis) {
  // Fallback function (implement a simpler combination method)
function combineAnalysesFallback(imageAnalysis, videoAnalysis) {
  let combinedAnalysis = "No image or video analysis available.";

  if (imageAnalysis && videoAnalysis) {
    combinedAnalysis = `Image Analysis: ${imageAnalysis.diagnosticResult} \n\n Video Analysis: ${videoAnalysis.diagnosticResult}`;
  } else if (imageAnalysis) {
    combinedAnalysis = `Image Analysis: ${imageAnalysis.diagnosticResult}`;
  } else if (videoAnalysis) {
    combinedAnalysis = `Video Analysis: ${videoAnalysis.diagnosticResult}`;
  }

  return combinedAnalysis;
}

  let combinedAnalysis = "No image or video analysis available.";

  if (imageAnalysis || videoAnalysis) {
    let fusionPrompt = `
      Combine and analyze the following medical analyses for insights related to pregnancy, focusing on conditions such as gestational diabetes, preeclampsia, preterm labor, fetal development, and maternal health:
    `;

    if (imageAnalysis) {
      fusionPrompt += `\nImage Analysis:\n${imageAnalysis.diagnosticResult}\n`;
    }

    if (videoAnalysis) {
      fusionPrompt += `\nVideo Analysis:\n${videoAnalysis.diagnosticResult}\n`;
    }

    fusionPrompt += `\nPay close attention to factors like fetal size and growth, amniotic fluid levels, placental health, maternal blood pressure, and any signs of potential complications.
    Provide a concise summary of the combined findings and their potential implications for the pregnancy.`;

    // Get insights from Gemini
    const chatSession = model.startChat({ generationConfig, safetySettings });
    try {
      const fusionResponse = await chatSession.sendMessage(fusionPrompt);
      combinedAnalysis = fusionResponse.response.text();
    } catch (error) {
      logger.error("Error during analysis fusion with Gemini:", error);
      logger.error("Error details:", error.response);
      // Consider a fallback mechanism:
      combinedAnalysis = combineAnalysesFallback(imageAnalysis, videoAnalysis); 
    }
  }

  return combinedAnalysis;
}

async function analyzeSDOHData(patientId) {
  try {
    // 1. Retrieve the latest 5 images for the patient from MongoDB
    const collection = await db.collection("image-sdoh-records");
    const imageRecord = await collection.findOne({ patientId });

    if (!imageRecord || !imageRecord.imageDataArray || imageRecord.imageDataArray.length === 0) {
      return "No image data found for this patient.";
    }

    // Get the latest 5 image data entries, sorted by timestamp
    const imageDataArray = imageRecord.imageDataArray
      .slice() // Create a copy to avoid modifying the original array
      .sort((a, b) => b.createdAt - a.createdAt) // Sort in descending order of timestamp
      .slice(0, 5); // Take only the latest 5

      // Delete the imageDataArray from the document after processing
    await collection.updateOne(
      { patientId },
      { $set: { imageDataArray: [] } } // Clear the imageDataArray
    );

    // 2. Process each image and call Vision API
    const sdohInsightsArray = await Promise.all(
      imageDataArray.map(async (imageDataEntry) => {
        const imageData = imageDataEntry.data.toString('base64');

        // 3. Call Google Cloud Vision API (LABEL_DETECTION, TEXT_DETECTION)
        const visionApiResponse = await callVisionAPI(imageData);

        // 4. Extract relevant labels and text from the response
        const labels = visionApiResponse.labels;
        const extractedText = visionApiResponse.text;

        // 5. Construct the Gemini prompt based on Vision API results
        let prompt = "";
        if (labels.length > 0 || extractedText !== "") {
          prompt = `
            Analyze the following information extracted from an image for social determinants of health insights:
            - Labels: ${labels.join(', ')}
            - Text: ${extractedText}

            Consider factors like:
              - Access to healthy food options
              - Neighborhood safety
              - Environmental hazards
              - Access to healthcare facilities
          `;
        } else {
          prompt = `
            I am unable to extract specific details from the provided image. 
            However, considering it is being analyzed for social determinants of health, 
            please provide general insights on factors like access to healthy food options, 
            neighborhood safety, environmental hazards, and access to healthcare facilities 
            that could be relevant.
          `;
        }

        // 6. Get SDOH insights from Gemini
        const chatSession = model.startChat({ generationConfig, safetySettings });
        const response = await chatSession.sendMessage(prompt);
        const sdohInsights = response.response.text();

        return sdohInsights;
      })
    );

    return sdohInsightsArray;
  } catch (error) {
    console.error('Error analyzing SDOH data:', error);
    throw error; // Re-throw for proper error handling
  }
}


async function callVisionAPI(imageData) {
  try {
    // Creates a client
    const client = new vision.ImageAnnotatorClient();

    // Convert the base64 imageData to a Buffer
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Set up the request object
    const request = {
      image: {
        content: imageBuffer,
      },
      features: [
        { type: 'LABEL_DETECTION' },
        { type: 'TEXT_DETECTION' }, 
        { type: 'LANDMARK_DETECTION' }, // Detect landmarks
        { type: 'OBJECT_LOCALIZATION' }, // Detect and locate objects
        { type: 'FACE_DETECTION' }, // Detect faces (might be useful for identifying emotions or demographics)
        { type: 'IMAGE_PROPERTIES' }, // Get image properties like dominant colors
        { type: 'SAFE_SEARCH_DETECTION' }, // Detect inappropriate content (might be relevant for SDOH)
      ],
    };

    // Send the request to the Cloud Vision API
    const [response] = await client.annotateImage(request);
    


    // Extract labels and text from the response
    const labels = response.labelAnnotations ? 
                   response.labelAnnotations.map(label => label.description) : 
                   [];
    const extractedText = response.textAnnotations ? 
                           response.textAnnotations[0]?.description : 
                           ''; // Taking the first text annotation

    return { labels, text: extractedText };

  } catch (error) {
    logger.error("Error calling Vision API:", error);
    throw error; // Re-throw to handle the error appropriately
  }
}

// Function to process Gemini's grounded prediction output
async function processGeminiPrediction(groundedPredictionOutput) {
  try {
    console.log("Into the world of processed prediction");
    console.log(groundedPredictionOutput)
    const riskAssessments = [];

    // 1. Split the output into sections (assuming each condition is a separate section)
    const sections = groundedPredictionOutput.split(/\n## /g); // Split by "## "

    // 2. Process each section
    for (const section of sections) {
      if (!section.trim()) continue; // Skip empty sections

      const lines = section.split('\n');
      let currentCondition = null;
      let riskLevel = null;
      let reasoning = null;
      let recommendations = [];
      let sources = []; // Array to store sources for each recommendation

      // 3. Extract data from each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (i === 0) { // First line is the condition
          currentCondition = line;
        } else if (line.startsWith('* **Risk Level:**')) {
          riskLevel = line.split('**Risk Level:**')[1].replace(/[*:]/g, '').trim();
        } else if (line.startsWith('* **Reasoning:**')) {
          reasoning = line.split('**Reasoning:**')[1].replace(/[*:]/g, '').trim();
        } else if (line.startsWith('* **')) { // Recommendation
          const recommendationText = line.replace(/[*:]/g, '').trim();
          recommendations.push(recommendationText);

          // Check for source link in the next line
          if (lines[i + 1] && lines[i + 1].startsWith('[Source:')) {
            const sourceLink = lines[i + 1].match(/\[Source: (.*?)\]/)[1];
            sources.push(sourceLink);
          } else {
            sources.push(null); // No source found
          }
        }
      }

      // 4. Add the extracted data to the riskAssessments array
      if (currentCondition && riskLevel && reasoning) {
        riskAssessments.push({
          condition: currentCondition,
          riskLevel,
          reasoning,
          recommendations: recommendations.map((rec, index) => ({
            advice: rec,
            source: sources[index]
          })),
        });
      }
    }

    console.log(riskAssessments);
    return riskAssessments;

  } catch (error) {
    logger.error("Error parsing Gemini prediction:", error);
    throw new Error("Unable to process prediction results.");
  }
}



router.post('/login', 
  // Validate patientId field
  [
    body('patientId').isString().notEmpty().withMessage('Patient ID is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { patientId } = req.body;

      // Find the patient record by patientId
      const patientRecord = await db.collection('records').findOne({ patientId });
      if (!patientRecord) {
        return res.status(401).json({ message: 'Invalid patient ID' });
      }

      // Generate JWT token for session management
      //const token = generateJWT({ patientId });

      res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Route to save initial patient record with secure handling
router.post('/register', 
  // Validate input fields
  [
    body('patientId').isString().notEmpty().withMessage('Patient ID is required'),
    body('basicInfo').isObject().notEmpty().withMessage('Basic information is required'),
    body('medicalHistoryText').isString().notEmpty().withMessage('Medical history text is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { patientId, basicInfo, medicalHistoryText } = req.body;

      // Extract medical history using the Gemini model
      const extractedMedicalHistory = await extractMedicalHistoryFromText(medicalHistoryText);

      // Encrypt sensitive data
      const encryptedBasicInfo = encrypt(JSON.stringify(basicInfo));
      const encryptedMedicalHistory = encrypt(extractedMedicalHistory);

      // Prepare and insert document into database
      const newDocument = {
        patientId,
        basicInfo: encryptedBasicInfo,
        medicalHistory: encryptedMedicalHistory,
        createdAt: new Date()
      };

      const collection = await db.collection('records');
      const result = await collection.insertOne(newDocument);

      res.status(201).json({
        message: 'Registration successful',
        recordId: result.insertedId
      });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);





// ... (Helper function to extract medical history from text)
async function extractMedicalHistoryFromText(text) {
  const prompt = `
    Extract key medical information relevant to pregnancy from the following text, focusing on:
    - Gravidity (number of pregnancies)
    - Parity (number of births)
    - History of gestational diabetes, preeclampsia, or other pregnancy complications
    - Family history of pregnancy-related issues
    - Current medications and allergies
    - Lifestyle factors (smoking, alcohol, drug use)

    Text: ${text}
  `;

  // Send prompt to Gemini and process response
  const chatSession = model.startChat({ generationConfig, safetySettings });
  const response = await chatSession.sendMessage(prompt);
  return response.response.text(); 
}

export default router;
