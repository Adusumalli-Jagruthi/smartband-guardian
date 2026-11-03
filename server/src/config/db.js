const mongoose = require("mongoose");
const env = require("./env");

async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}
module.exports = { connectDb };
