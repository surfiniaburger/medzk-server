import { MongoClient, ServerApiVersion } from "mongodb";

const URI = process.env.ATLAS_URI || "";
const client = new MongoClient(URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function initializeDB() {
  try {
    // Connect the client to the server
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    
    // Initialize database
    db = client.db("patients");
    
    // Create TTL index for OTP collection
    await db.collection("otps").createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 300 } // OTPs expire after 5 minutes
    );
    
    // Create indexes for optimization
    await Promise.all([
      // Index for user email lookups
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      
      // Compound index for OTP lookups
      db.collection("otps").createIndex({ email: 1, createdAt: -1 })
    ]);

    console.log("Database indexes created successfully");
    
    return db;
  } catch (err) {
    console.error("Database initialization error:", err);
    throw err;
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Initialize database connection
const database = await initializeDB().catch(console.error);

export default database;

// Optional: Export client for direct access if needed
export { client };