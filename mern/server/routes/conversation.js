// import express from "express";
// import db from "../db/connection.js";
// import { body, validationResult } from 'express-validator';
// import { conversationAgent } from "../utils/conversation-agent.js";
// import { MongoClient } from "mongodb";
// import logger from '../utils/logger.js';

// const router = express.Router();

// // Initialize MongoDB client
// const client = new MongoClient(process.env.ATLAS_URI);

// // Route to continue conversation with a prediction
// router.post("/continue/:threadId",
//   [
//     body('message').isString().notEmpty().withMessage('Message is required'),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     try {
//       const { threadId } = req.params;
//       const { message } = req.body;

//       // Get the prediction data from the database
//       const predictionRecord = await db.collection("predictions").findOne(
//         { threadId },
//         { sort: { createdAt: -1 } }
//       );

//       if (!predictionRecord) {
//         return res.status(404).json({ error: "No prediction found for this thread" });
//       }

//       // Call the conversation agent with the prediction data
//       const response = await conversationAgent(
//         client,
//         message,
//         threadId,
//         predictionRecord.groundedPredictionOutput
//       );

//       res.status(200).json({ response });
//     } catch (error) {
//       logger.error("Error in conversation:", error);
//       res.status(500).json({ error: "Internal server error" });
//     }
//   }
// );

// export default router;