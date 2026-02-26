// scripts/replace_school_demo.js
// Usage:
// node scripts/replace_school_demo.js <SCHOOL_ID|ALL> <PRINCIPAL_USERNAME> <PRINCIPAL_PLAINTEXT_PASSWORD>
//
// Examples:
// node scripts/replace_school_demo.js ALL demo_principal abhay@123
// node scripts/replace_school_demo.js 68e4d2d011840fdaa11a17e2 demo_principal abhay@123

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const School = require("../models/school");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yourdb";
const SALT_ROUNDS = 10;

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: node scripts/replace_school_demo.js <SCHOOL_ID|ALL> <PRINCIPAL_USERNAME> <PRINCIPAL_PLAINTEXT_PASSWORD>");
    process.exit(1);
  }
  const [TARGET, PRINCIPAL_USERNAME, PRINCIPAL_PLAIN] = args;

  await mongoose.connect(MONGO_URI);
  console.log("Connected to:", MONGO_URI);

  try {
    if (TARGET === "ALL") {
      const del = await School.deleteMany({});
      console.log("Deleted all schools:", del.deletedCount);
    } else {
      const del = await School.deleteOne({ _id: TARGET });
      console.log("Deleted school count:", del.deletedCount, "for _id:", TARGET);
    }

    const passHash = await bcrypt.hash(PRINCIPAL_PLAIN, SALT_ROUNDS);
    const demoSchool = {
      name: "Demo Public School",
      school_image: "https://example.com/demo/school.jpg",
      mission_statement: "To provide quality demo education for testing and development.",
      school_certificate_images: [
        "https://example.com/demo/cert1.jpg",
        "https://example.com/demo/cert2.jpg"
      ],
      principal: {
        name: "Demo Principal",
        username: PRINCIPAL_USERNAME.toLowerCase().trim(),
        passwordHash: passHash,
        email: "principal@demo.edu",
        phone: "+919999999999",
        image_url: "https://example.com/demo/principal.jpg",
        bio: "Demo principal for testing",
        address: "Demo address",
        gender: "Other",
        dob: null,
        isActive: true,
        lastLoginAt: null
      },
      contact_info: {
        address: "Demo Address, City",
        phone: "+91-1111111111",
        email: "info@demo.edu"
      },
      staff: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const created = await School.create(demoSchool);
    console.log("Created demo school with _id:", created._id.toString());
    console.log("Principal username:", created.principal.username);
    console.log("Principal password hash start:", created.principal.passwordHash.slice(0,6));
    await mongoose.disconnect();
    console.log("DONE");
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch(e) {}
    process.exit(1);
  }
}

run();
