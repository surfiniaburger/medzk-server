import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import 'dotenv/config';

const PORT = process.env.PORT || 5050;
const app = express();

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://medzk-server.vercel.app',
      'https://medzk-server.onrender.com',
      'https://www.zerokare.info',
      'https://zerok.web.app',
      'https://zero-kare5-837262597425.us-central1.run.app',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
}));

// Handle preflight requests
app.options('*', cors()); // Respond to OPTIONS for all routes

// Body parser middleware
app.use(express.json());

app.use("/record", records);

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});