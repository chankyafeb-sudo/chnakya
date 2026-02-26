// scripts/update-passwords.js
// Safe, non-destructive: updates passwordHash for principal/staff and all students to bcrypt('akshansh').
// Run from project root: node .\scripts\update-passwords.js

const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const projectRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(projectRoot, ".env") });

// Choose connection string: prefer MONGO_URL then MONGO_URI, fallback to localhost
let MONGO = (process.env.MONGO_URL || process.env.MONGO_URI || "").trim();
if (!MONGO || !(MONGO.startsWith("mongodb://") || MONGO.startsWith("mongodb+srv://"))) {
  console.warn("MONGO env (MONGO_URL/MONGO_URI) missing or invalid. Falling back to mongodb://localhost:27017/school_seed_db");
  MONGO = "mongodb://localhost:27017/school_seed_db";
}

const Staff = require(path.join(projectRoot, "models", "staff"));
const School = require(path.join(projectRoot, "models", "school"));
const Student = require(path.join(projectRoot, "models", "student"));

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO);

  try {
    const plain = "akshansh";
    const SALT_ROUNDS = 10;
    const hash = await bcrypt.hash(plain, SALT_ROUNDS);

    console.log("Generated bcrypt hash for password 'akshansh'.");

    // 1) Update Staff (username = 'akshansh') — set passwordHash (no other fields changed)
    const staffUpdate = await Staff.findOneAndUpdate(
      { username: "akshansh" },
      { $set: { passwordHash: hash } },
      { new: true, upsert: false, runValidators: false }
    ).lean();

    if (staffUpdate) {
      console.log("Updated Staff passwordHash for username 'akshansh' -> _id:", staffUpdate._id.toString());
    } else {
      console.log("No Staff found with username 'akshansh' (skipped).");
    }

    // 2) Update School.principal where principal.username == 'akshansh'
    const schoolUpdate = await School.findOneAndUpdate(
      { "principal.username": "akshansh" },
      { $set: { "principal.passwordHash": hash } },
      { new: true, upsert: false, runValidators: false }
    ).lean();

    if (schoolUpdate) {
      console.log("Updated School.principal.passwordHash for school _id:", schoolUpdate._id.toString());
    } else {
      console.log("No School found with principal.username 'akshansh' (skipped).");
    }

    // 3) Update ALL Students: set both password and passwordHash to the same hash
    // (This makes every student's password 'akshansh' — as you requested)
    const studentsResult = await Student.updateMany(
      {},
      { $set: { password: hash, passwordHash: hash } }
    );

    console.log(`Updated ${studentsResult.modifiedCount} student documents' password/passwordHash.`);

    // 4) (Optional) show a small sample of users updated (non-sensitive)
    const sampleStaff = await Staff.find({ username: { $in: ["akshansh"] } }).select("username name").lean();
    const sampleSchool = await School.find({ "principal.username": "akshansh" }).select("name principal.username").lean();
    const sampleStudents = await Student.find({}).limit(5).select("name username").lean();

    console.log("Samples after update:");
    console.log(" Staffs:", sampleStaff.map(s => ({ username: s.username, name: s.name })));
    console.log(" Schools:", sampleSchool.map(s => ({ _id: s._id?.toString(), principal: s.principal?.username, name: s.name })));
    console.log(" Students sample (first 5):", sampleStudents.map(s => ({ username: s.username, name: s.name })));

    console.log("Password update operation complete. No deletions performed.");
  } catch (err) {
    console.error("ERROR during update:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected. Done.");
  }
}

run().catch(err => {
  console.error("Fatal error:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
