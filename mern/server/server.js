import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import 'dotenv/config';
import { CognitoJwtVerifier } from "aws-jwt-verify";

const PORT = process.env.PORT || 5050;
const app = express();

const corsOptions = {
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
  methods: 'GET,POST,PUT,DELETE, OPTIONS',
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Amz-Date',
    'X-Api-Key',
    'X-Amz-Security-Token'
  ],
  credentials: true,
  maxAge: 86400 ,
  preflightContinue: false,
  optionsSuccessStatus: 204
}

// Configure CORS
app.use(cors(corsOptions));


// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Add this to your server.js
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});

// Middleware to verify JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.sendStatus(401);
    
    const token = authHeader.split(' ')[1];
    const payload = await verifier.verify(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};

// Use the middleware on protected routes
app.use("/record", authenticateToken, records);





// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});