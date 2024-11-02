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
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold} from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import logger from '../utils/logger.js'; 
import crypto from 'crypto';
import { body, param, validationResult } from 'express-validator'; // Import validation middleware
import vision from "@google-cloud/vision"
import jwt from 'jsonwebtoken';

 // Function to generate JWT token
 function generateJWT(payload) {
   return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
 }

 function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}


// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Get recommendations based on condition
router.get("/recommendations/:condition", async (req, res) => {
  const condition = req.params.condition.toLowerCase();

  // Recommendations with sources
  const recommendations = {
    diabetes: {
      recommendations: [
        {
          advice: "Monitor blood sugar levels regularly.",
          source: {
            name: "NIDDK - Healthy Living with Diabetes",
            link: "https://www.niddk.nih.gov/health-information/diabetes/overview/healthy-living-with-diabetes"
          }
        },
        {
          advice: "Follow a balanced diet with low sugar and carbohydrates.",
          source: {
            name: "Endotext - Dietary Advice For Individuals with Diabetes",
            link: "https://www.ncbi.nlm.nih.gov/books/NBK279012/"
          }
        },
        {
          advice: "Exercise regularly to maintain a healthy weight.",
          source: {
            name: "Better Health Channel - Diabetes and Healthy Eating",
            link: "https://www.betterhealth.vic.gov.au/health/conditionsandtreatments/diabetes-and-healthy-eating"
          }
        },
        {
          advice: "Consult a healthcare professional for personalized advice.",
          source: {
            name: "Healthline - 16 Best Foods for People with Diabetes",
            link: "https://www.healthline.com/nutrition/16-best-foods-for-diabetics"
          }
        }
      ]
    },
    hypertension: {
      recommendations: [
        {
          advice: "Reduce salt intake.",
          source: {
            name: "American Heart Association - Sodium and Salt",
            link: "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/nutrition-basics/sodium-and-salt"
          }
        },
        {
          advice: "Maintain a healthy weight.",
          source: {
            name: "CDC - Healthy Weight",
            link: "https://www.cdc.gov/healthyweight/index.html"
          }
        },
        {
          advice: "Exercise regularly.",
          source: {
            name: "Mayo Clinic - Exercise and Hypertension",
            link: "https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/in-depth/exercise-and-high-blood-pressure/art-20045839"
          }
        },
        {
          advice: "Monitor blood pressure frequently.",
          source: {
            name: "American Heart Association - Monitoring Blood Pressure",
            link: "https://www.heart.org/en/health-topics/high-blood-pressure/monitoring-blood-pressure"
          }
        }
      ]
    },
    // Add more conditions as needed
  };

  const conditionData = recommendations[condition];

  if (conditionData) {
    res.status(200).json({
      condition,
      recommendations: conditionData.recommendations,
    });
  } else {
    res.status(404).json({ error: "Recommendations not found for this condition." });
  }
});



router.get("/search/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

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
    res.status(200).json({
      patientId,
      recordHash,
      criteriaHash,
      decryptedData,
      isValid
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

      // Upload each image to Gemini for processing
      const uploadedImages = await Promise.all(
        images.map(image => uploadToGemini(image.path, image.mimetype))
      );

      // Wait for all files to become active
      const activeImageFiles = await Promise.all(
        uploadedImages.map(file => waitForFilesActive(file))
      );

      // Store image URIs (or other relevant data) in your database
      // ... (Logic to associate image URIs with the patientId)

      res.status(201).json({
        message: "Images uploaded successfully",
        uploadedImageUrls: activeImageFiles.map(file => file.uri) 
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

      // Upload the video to Gemini for processing
      const uploadedVideo = await uploadToGemini(video.path, video.mimetype);

      // Wait for the file to become ACTIVE
      const activeFile = await waitForFilesActive(uploadedVideo);

      // Store video URI (or other relevant data) in your database
      // ... (Logic to associate video URI with the patientId)

      res.status(201).json({
        message: "Video uploaded successfully",
        uploadedVideoUrl: activeFile.uri 
      });

    } catch (error) {
      logger.error("Error uploading video:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// *** Predict Route (Modified) ***
router.post("/predict", async (req, res) => {
  try {
    const { patientId, uploadedImageUrls, uploadedVideoUrl } = req.body; 
    logger.info('Received request for patientId:', patientId);

    // ... (Data Gathering & Enrichment - same as before)

    // Image Analysis (if applicable)
    if (uploadedImageUrls && uploadedImageUrls.length > 0) {
      // ... (Process each image URL to get imageAnalysis)
      // Example (assuming you have a function to analyze a single image URL):
      const imageAnalysisPromises = uploadedImageUrls.map(imageUrl => analyzeImage(imageUrl));
      const imageAnalysisResults = await Promise.all(imageAnalysisPromises);
      // ... (Combine imageAnalysisResults as needed)
    }

    // Video Analysis (if applicable)
    if (uploadedVideoUrl) {
      // ... (Process the video URL to get videoAnalysis)
    }

    // ... (Rest of your /predict logic - Gemini prompt, response processing, etc.)

  } catch (error) { 
    // ... (Error handling)
  }
});




// Route to get predictions and recommendations
router.post("/predict", async (req, res) => {
  try {
    const { patientId, uploadedImageUrls, uploadedVideoUrl } = req.body;
    logger.info('Received request for patientId:', patientId);

    // 1. Data Gathering & Enrichment:
    //   - Fetch existing record from database based on patientId
    const existingRecord = await db.collection("records").findOne({ patientId });
    if (!existingRecord) {
      return res.status(404).json({ error: "Record not found" });
    }

    //   - Extract medical history from unstructured text (e.g., 'notes' field)
    const extractedMedicalHistory = await extractMedicalHistoryFromText(existingRecord); // Implement this function

   // Handle image and video uploads (if any)
   let imageAnalysis = null;
   let videoAnalysis = null;
   let sdohAnalysis = "No image data provided for SDOH analysis.";

   if (req.files && req.files.images) {
    const activeImageFiles = await handleFileUpload(req, res, 'image');

    // Process activeImageFiles to get imageAnalysis
    if (activeImageFiles && activeImageFiles.length > 0) {
      const imageAnalysisPromises = activeImageFiles.map(async (imageFile) => {
        // Construct the image analysis prompt for Gemini (similar to your /image route)
        const imagePrompt = `
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
          `;


        const chatSession = model.startChat({ generationConfig, safetySettings });
        const imageResponse = await chatSession.sendMessage(imagePrompt);
        return imageResponse.response.text(); // Or process the response as needed
      });

      const imageAnalysisResults = await Promise.all(imageAnalysisPromises);
      imageAnalysis = { 
        diagnosticResult: imageAnalysisResults.join('\n\n') 
      }; 

      // Analyze SDOH data using the first uploaded image
      sdohAnalysis = await analyzeSDOHData(req.files.images[0].path); 
    }
  }

  if (req.files && req.files.video) {
    const activeVideoFiles = await handleFileUpload(req, res, 'video');
  
    // Process activeVideoFiles to get videoAnalysis (similar to image processing)
    if (activeVideoFiles && activeVideoFiles.length > 0) {
      const videoAnalysisPromises = activeVideoFiles.map(async (videoFile) => {
        // Construct the video analysis prompt for Gemini
        const videoPrompt = `
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
  
        const chatSession = model.startChat({ generationConfig, safetySettings });
        const videoResponse = await chatSession.sendMessage(videoPrompt);
        return videoResponse.response.text(); // Or process the response as needed
      });
  
      const videoAnalysisResults = await Promise.all(videoAnalysisPromises);
      videoAnalysis = { 
        diagnosticResult: videoAnalysisResults.join('\n\n') 
      }; 
    }
  }
  
    //   - Get existing image/video analysis result (if applicable)
   
    const existingImageAnalysis = await getExistingImageAnalysisResult(patientId);
    const existingVideoAnalysis = await getExistingVideoAnalysisResult(patientId);

    const combinedAnalysis = await combineAnalysisResults(existingImageAnalysis, existingVideoAnalysis)

    // 2. Gemini Multimodal Analysis:
    const prompt = `
      Patient: ${patientId}
      Medical History: ${extractedMedicalHistory}
      SDOH Insights: ${sdohAnalysis}
      Image Analysis (New Uploads): ${imageAnalysis ? imageAnalysis.diagnosticResult : "No new image analysis."}
      Video Analysis (New Uploads): ${videoAnalysis ? videoAnalysis.diagnosticResult : "No new video analysis."}
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

    // 3. Process & Return Results:
    //   - Extract risk scores and recommendations from Gemini's response
    const { riskScores, recommendations, explanations } = processGeminiPrediction(predictionOutput); // Implement this function

    res.status(200).json({ 
      riskScores, 
      recommendations, 
      explanations 
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
      // Consider a fallback mechanism:
      combinedAnalysis = combineAnalysesFallback(imageAnalysis, videoAnalysis); 
    }
  }

  return combinedAnalysis;
}


async function analyzeSDOHData(imagePath) {
  if (imagePath) {
    // 1. Read image data from the file path
    const imageData = fs.readFileSync(imagePath, 'base64'); // Read as base64

    // 2. Call Google Cloud Vision API (LABEL_DETECTION, TEXT_DETECTION)
    const visionApiResponse = await callVisionAPI(imageData); 

    // 2. Extract relevant labels and text from the response
    const labels = visionApiResponse.labels; 
    const extractedText = visionApiResponse.text;

    // 3. Construct the Gemini prompt 
    const prompt = `
      Analyze the following information extracted from an image for social determinants of health insights:
      - Labels: ${labels.join(', ')}
      - Text: ${extractedText}

      Consider factors like:
        - Access to healthy food options
        - Neighborhood safety
        - Environmental hazards
        - Access to healthcare facilities
    `;

    // 4. Get SDOH insights from Gemini
    const chatSession = model.startChat({ generationConfig, safetySettings });
    const response = await chatSession.sendMessage(prompt);
    const sdohInsights = response.response.text();

    return sdohInsights;
  } else {
    return "No image data provided."; 
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
        { type: 'TEXT_DETECTION' }, // Add more features if needed
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

// Function to process Gemini's prediction output
async function processGeminiPrediction(predictionText) {
  try {
    // 1. Split the prediction text into lines
    const lines = predictionText.split('\n');

    // 2. Initialize variables to store extracted data
    const riskScores = {};
    const recommendations = [];
    const explanations = {};

    // 3. Define keywords or patterns to identify sections (adjust as needed)
    const riskKeyword = "Risk Assessment:";
    const recommendationKeyword = "Recommendations:";
    const explanationKeyword = "Explanation:";

    // 4. Iterate through each line to extract information
    let currentSection = null;
    lines.forEach(line => {
      // Find the start of a new section
      if (line.includes(riskKeyword)) {
        currentSection = "risk";
      } else if (line.includes(recommendationKeyword)) {
        currentSection = "recommendation";
      } else if (line.includes(explanationKeyword)) {
        currentSection = "explanation";
      } else if (currentSection && line.trim() !== "") { // Process lines within a section
        switch (currentSection) {
          case "risk":
            const [condition, score] = line.split(':').map(s => s.trim());
            riskScores[condition] = parseFloat(score); // Assuming scores are numerical
            break;
          case "recommendation":
            recommendations.push(line.trim());
            break;
          case "explanation":
            // Assuming explanations are in "Condition: Explanation" format
            const [expCondition, expText] = line.split(':').map(s => s.trim());
            explanations[expCondition] = expText;
            break;
        }
      }
    });

    // 5. Return the extracted data
    return { riskScores, recommendations, explanations };

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
      const token = generateJWT({ patientId });

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

router.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Protected route accessed', user: req.user });
});



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
