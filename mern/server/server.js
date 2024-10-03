// server.js

import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import { connectDB } from "./db/connection.js";

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());

const startServer = async () => {
  try {
    const db = await connectDB();
    
    // Make the database accessible to your routes
    app.use("/record", records(db)); // Pass `db` to your routes

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1); // Exit the process with failure
  }
};

startServer();
