import { QueueEvents } from 'bullmq';

// Create a new QueueEvents instance for monitoring job events
const queueEvents = new QueueEvents('video-upload', { connection: redisConnection });

// Listen to job events
queueEvents.on('waiting', ({ jobId }) => {
  console.log(`A job with ID ${jobId} is waiting`);
});

queueEvents.on('active', ({ jobId, prev }) => {
  console.log(`Job ${jobId} is now active; previous status was ${prev}`);
});

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`Job ${jobId} has completed and returned ${returnvalue}`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.log(`Job ${jobId} has failed with reason: ${failedReason}`);
});
