import express from "express";
import cors from "cors";
import records from "./routes/record.js";
const PORT = process.env.PORT || 5050;
const app = express();

// Configure CORS 
app.use(cors({
  origin: ['https://medzk-server.vercel.app', 'http://localhost:3000', 'https://upgraded-palm-tree.vercel.app'],
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Accept', 'Content-Type'],
  credentials: true,
}));


app.use(express.json());


app.use("/record", records);



// Start the Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

