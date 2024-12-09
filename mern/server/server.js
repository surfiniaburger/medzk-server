import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';



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


app.use("/record", records);

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

// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});