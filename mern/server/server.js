import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';
//import conversation from "./routes/conversation.js";
import axios from 'axios'



const PORT = process.env.PORT || 5050;
const app = express();






// Handle Google Credentials Setup conditionally based on environment
if (process.env.NODE_ENV === 'production') {
  const googleCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (googleCredentials) {
    const credentialsPath = path.resolve('./gem-creation.json');
    fs.writeFileSync(credentialsPath, googleCredentials);

    // Set the GOOGLE_APPLICATION_CREDENTIALS environment variable
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
  } else {
    console.error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is missing!");
    process.exit(1);
  }
} else {
  console.log("Skipping Google Credentials setup in development environment.");
}



// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://medzk-server.vercel.app',
      'https://medzk-server.onrender.com',
      'https://www.zerokare.info',
      
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


// Body parser middleware
app.use(express.json());

// Environment variables - adjust these according to your setup
const OAUTH_CONFIG = {
  tokenUrl: 'https://34.49.13.123.nip.io/token',
  proxyBaseUrl: 'https://34.49.13.123.nip.io/Zerok',
  consumerKey: process.env.CONSUMER_KEY,
  consumerSecret: process.env.CONSUMER_SECRET
};

// Token management
let cachedToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  try {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
      return cachedToken;
    }

    const auth = Buffer.from(
      `${OAUTH_CONFIG.consumerKey}:${OAUTH_CONFIG.consumerSecret}`
    ).toString('base64');

    const response = await axios({
      method: 'post',
      url: OAUTH_CONFIG.tokenUrl,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials'
    });

    cachedToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

    return cachedToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};



app.use("/record", async (req, res, next) => {
  try {
    const token = await getAccessToken(); // Generate or retrieve the cached token
    req.accessToken = token; // Attach the token to the request object
    // Set up Axios interceptor for outgoing requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    next();
  } catch (error) {
    console.error("Failed to attach token:", error);
    res.status(500).json({ error: "Failed to authenticate request" });
  }
}, records);



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In your existing Express app:
app.use('/models', express.static(path.join(__dirname, 'routes/views'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.glb') {
      res.set('Content-Type', 'model/gltf-binary');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Access-Control-Allow-Origin', '*');
    }
  }
}));

// Load the conversation routes
//app.use("/conversation", conversation);


// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});