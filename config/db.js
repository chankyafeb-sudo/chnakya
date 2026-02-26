const mongoose = require("mongoose");
require("dotenv").config();
console.log("Loaded MONGO_URL:", process.env.MONGO_URL);
const mongoUrl = process.env.MONGO_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUrl); // no extra options needed
    console.log("Loaded MONGO_URL:", process.env.MONGO_URL);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
