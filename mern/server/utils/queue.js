// Import BullMQ and ioredis
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Create a Redis instance using ioredis
const redisConnection = new IORedis({
  host: 'localhost', // Change to your Redis host
  port: 6380,        // Change to your Redis port
 // If Redis is protected by a password
});

// Create a queue and pass the Redis connection
const videoQueue = new Queue('video-upload', { connection: redisConnection });

// Function to add jobs to the queue
async function handleVideoUpload(path, mimeType) {
  const job = await videoQueue.add('processVideo', { path, mimeType });
  console.log(`Job ${job.id} added to the queue`);
}

// Example job addition
handleVideoUpload('video.mp4', 'video/mp4').catch(console.error);
