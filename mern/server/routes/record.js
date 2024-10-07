// server/routes/recordRoutes.js

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

// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
 // Initialize Google Generative AI
 const gkey = process.env.GEMINI_API_KEY || null;
 if (!gkey) {
  console.error('API key is not valid or not found in the config.env file');
} else {
  console.log('API key loaded successfully:');
}
 const genAI = new GoogleGenerativeAI(gkey);
 const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" });
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
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

// Function to wait for the file to become ACTIVE
async function waitForFilesActive(file) {
  console.log("Waiting for file processing...");
  let currentFile = await fileManager.getFile(file.name);
  while (currentFile.state === "PROCESSING") {
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds
    currentFile = await fileManager.getFile(file.name);
  }
  if (currentFile.state !== "ACTIVE") {
    throw new Error(`File ${currentFile.name} failed to process`);
  }
  console.log("\nFile is ready for use.");
  return currentFile;
}


// Helper function to generate SHA-256 hash
const cryptoHash = async (data) => {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
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


// Get all records
router.get("/", async (req, res) => {
  try {
    const collection = await db.collection("records");
    const results = await collection.find({}).toArray();
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching records:", error);
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
      console.log(result)
      res.status(200).json(result);
      console.log(result)
    }
  } catch (error) {
    console.error("Error fetching record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { patientId, recordHash, criteriaHash, recordData } = req.body;

    if (!patientId || !recordHash || !criteriaHash || !recordData) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const encryptedRecordData = {
      name: encrypt(recordData.name),
      age: encrypt(recordData.age.toString()),
      bloodType: encrypt(recordData.bloodType),
      diagnosis: encrypt(recordData.diagnosis),
      riskScore: encrypt(recordData.riskScore.toString())
    };

    console.log("Encrypted Record Data:", encryptedRecordData);

    const vKeyResponse = await fs.promises.readFile(
      path.join(__dirname, '../data/verification_key.json'),
      'utf-8'
    );
    const vKey = JSON.parse(vKeyResponse);

    // Hash the verification key
    const verificationKeyHash = await cryptoHash(vKey);
    console.log("Verification Key Hash:", verificationKeyHash);

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
    console.error("Error adding record:", err);
    res.status(500).json({ error: "Error adding record" });
  }
});

// Update a record by ID
router.patch("/:id", async (req, res) => {
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
    console.error("Error updating record:", err);
    res.status(500).json({ error: "Error updating record" });
  }
});

// Delete a record by ID
router.delete("/:id", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };

    const collection = await db.collection("records");
    const result = await collection.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error("Error deleting record:", err);
    res.status(500).json({ error: "Error deleting record" });
  }
});

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
    const vKeyHash = await cryptoHash(vKey);

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
    console.error("Error retrieving and verifying record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/image", upload.array('images', 5), async (req, res) => {
  try {
    const { patientId, metadata } = req.body;
    const images = req.files; // Array of uploaded images

    // Validate required fields
    if (!patientId || !metadata || !images || images.length === 0) {
      return res.status(400).json({ error: "Missing required fields: patientId, metadata, and at least one image" });
    }

    // Parse metadata
    let parsedMetadata;
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid metadata format. Must be a valid JSON string." });
    }

    // Define the prompt for Gemini AI
    const prompt = "Analyze the provided MRI images for any anomalies or indicators of brain tumors. Identify potential abnormalities, providing insights into possible diagnoses and relevant details from the image data.";

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
    const recordHash = await cryptoHash(recordDataForHash);

    // Generate criteriaHash from metadata
    const criteriaHash = await cryptoHash(parsedMetadata);

    // Encrypt diagnosticResult
    const encryptedDiagnosticResult = encrypt(diagnosticResult);

    // Read and hash verification key
    const vKeyResponse = await fs.promises.readFile(
      path.join(__dirname, '../data/verification_key.json'),
      'utf-8'
    );
    const vKey = JSON.parse(vKeyResponse);

    // Hash the verification key
    const verificationKeyHash = await cryptoHash(vKey);

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
    console.error("Error creating image record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
    const vKeyHash = await cryptoHash(vKey);

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
    console.error("Error retrieving and verifying image record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/video", upload.single('video'), async (req, res) => {
  try {
    const { patientId, metadata } = req.body;
    const video = req.file; // The uploaded video

    // Validate required fields
    if (!patientId || !metadata || !video) {
      return res.status(400).json({ error: "Missing required fields: patientId, metadata, or video" });
    }

    // Parse metadata
    let parsedMetadata;
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid metadata format. Must be a valid JSON string." });
    }

    // Define the prompt for Gemini AI
    const prompt = "Analyze the provided video for any medical anomalies or indicators related to brain health. Provide detailed diagnostic insights.";

    // Upload the video to Gemini for processing
    const uploadedVideo = await uploadToGemini(video.path, video.mimetype);

    // Wait for the file to become ACTIVE
    const activeFile = await waitForFilesActive(uploadedVideo);

    // Proceed with further processing once the file is ACTIVE
    console.log("File is ready:", activeFile);

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
    const recordHash = await cryptoHash(recordDataForHash);

    // Generate criteriaHash from metadata
    const criteriaHash = await cryptoHash(parsedMetadata);

    // Encrypt diagnosticResult
    const encryptedDiagnosticResult = encrypt(diagnosticResult);

    // Read and hash verification key
    const vKeyResponse = await fs.promises.readFile(
      path.join(__dirname, '../data/verification_key.json'),
      'utf-8'
    );
    const vKey = JSON.parse(vKeyResponse);

    // Hash the verification key
    const verificationKeyHash = await cryptoHash(vKey);

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
    console.error("Error creating video record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
    const vKeyHash = await cryptoHash(vKey);

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
    console.error("Error retrieving and verifying video record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
