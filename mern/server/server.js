import express from "express";
import cors from "cors";
import records from "./routes/record.js";

const PORT = process.env.PORT || 5050;
const app = express();

// Configure CORS to allow requests from a specific origin
const corsOptions = {
  origin: 'https://medzk-server.onrender.com', // Allow this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
  credentials: true // Allow credentials (if needed)
};

// Configure CORS
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());

app.use("/record", records);

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});