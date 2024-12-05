// models/otp.js
const { ObjectId } = require('mongodb');

const createOTPSchema = (db) => {
  return db.collection("otps").createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 }); // 5 minutes
};
