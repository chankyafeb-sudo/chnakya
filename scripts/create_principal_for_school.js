// scripts/create_principal_for_school.js
// Usage:
// node scripts/create_principal_for_school.js <SCHOOL_ID> <USERNAME> <PLAINTEXT_PASSWORD> "<FULL_NAME>" "<EMAIL>" "<PHONE>"

const mongoose = require("mongoose");
const School = require("../models/school");
const { hashedPassword } = require("../utils/password");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yourdb";

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 6) {
    console.error("Usage: node scripts/create_principal_for_school.js <SCHOOL_ID> <USERNAME> <PLAINTEXT_PASSWORD> \"<FULL_NAME>\" \"<EMAIL>\" \"<PHONE>\"");
    process.exit(1);
  }
  const [SCHOOL_ID, USERNAME, PLAIN_PASS, FULL_NAME, EMAIL, PHONE] = args;

  console.log("Connecting to:", MONGO_URI);
  await mongoose.connect(MONGO_URI);

  try {
    const school = await School.findById(SCHOOL_ID).exec();
    if (!school) {
      console.error("School not found:", SCHOOL_ID);
      process.exit(1);
    }

    // Build principal object
    const pwHash = await hashedPassword(PLAIN_PASS);
    const principalObj = {
      name: FULL_NAME,
      username: USERNAME.toLowerCase().trim(),
      passwordHash: pwHash,
      email: EMAIL || null,
      phone: PHONE || null,
      image_url: null,
      bio: null,
      address: null,
      gender: null,
      dob: null,
      isActive: true,
      lastLoginAt: null
    };

    school.principal = principalObj;
    await school.save();

    console.log("✅ Principal created/updated for school:", SCHOOL_ID);
    console.log("principal:", {
      name: school.principal.name,
      username: school.principal.username,
      email: school.principal.email,
      phone: school.principal.phone,
      passwordHashStartsWith: school.principal.passwordHash && school.principal.passwordHash.slice(0,4)
    });
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    try { await mongoose.disconnect(); } catch(e) {}
  }
}

run();
