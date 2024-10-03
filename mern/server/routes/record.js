// server/routes/recordRoutes.js

import express from "express";
import db from "../db/connection.js";
import { ObjectId } from "mongodb";
import { encrypt, decrypt } from "../utils/encryption.js";
import { verifyProof } from "../utils/verification.js";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as snarkjs from 'snarkjs';

// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper function to generate SHA-256 hash
const cryptoHash = async (data) => {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Export a function that takes `db` as a parameter
const createRecordRoutes = (db) => {

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



router.get("/decrypt/:patientId", async (req, res) => {
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

    const { encryptedData } = record;

    // Log the encrypted data to verify
    console.log("Encrypted Data:", encryptedData);

    // Check if encryptedData is an object
    if (typeof encryptedData !== 'object' || !encryptedData) {
      return res.status(400).json({ error: "Invalid encrypted data format" });
    }

    // Decrypt each field individually
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

    // Step 2: Return the decrypted data
    res.status(200).json({
      patientId,
      decryptedData // Return the fully decrypted object
    });
  } catch (error) {
    console.error("Error retrieving and decrypting record:", error);
    
    // Handle specific decryption errors
    if (error instanceof TypeError) {
      return res.status(400).json({ error: "Decryption error: " + error.message });
    }

    res.status(500).json({ error: "Internal server error" });
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

    // Step 1: Load verification key, wasm, and zkey files
    const vKeyResponse = await fs.promises.readFile(
      path.join(__dirname, '../data/verification_key.json'),
      'utf-8'
    );
    const vKey = JSON.parse(vKeyResponse);

    const wasmBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit.wasm')
    );

    const zkeyBuffer = await fs.promises.readFile(
      path.join(__dirname, '../data/circuit_final.zkey')
    );

    // Step 2: Prepare the input to generate the proof with 0x prefix
    const input = {
      recordHash: `0x${recordHash}`,
      criteriaHash: `0x${criteriaHash}`
    };

    // Step 3: Generate proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      new Uint8Array(wasmBuffer),
      new Uint8Array(zkeyBuffer)
    );

    // Step 4: Verify the proof
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

    if (!isValid) {
      return res.status(400).json({ error: "Proof verification failed" });
    }

     // Check if encryptedData is an object
     if (typeof encryptedData !== 'object' || !encryptedData) {
      return res.status(400).json({ error: "Invalid encrypted data format" });
    }

    // Decrypt each field individually
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

    // Step 6: Return the decrypted data and verification result
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

return router;
};

export default router;
