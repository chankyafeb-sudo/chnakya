// debug-principal-quick.js
// Put this file in project_root/scripts and run: node debug-principal-quick.js
// This script loads .env, reads MONGO_URL or MONGO_URI, resolves project root and models robustly.

require("dotenv").config();
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const projectRoot = path.resolve(__dirname, ".."); // parent of scripts/
const modelsPath = (name) => path.join(projectRoot, "models", name);

// Prefer MONGO_URL, then MONGO_URI, then fallback to local
let MONGO =
  process.env.MONGO_URL ||
  process.env.MONGO_URI ||
  process.env.MONGO_URI_RAW ||
  "";
MONGO = typeof MONGO === "string" ? MONGO.trim() : "";
if (
  !MONGO ||
  !(MONGO.startsWith("mongodb://") || MONGO.startsWith("mongodb+srv://"))
) {
  console.warn(
    "MONGO env (MONGO_URL/MONGO_URI) missing or invalid. Falling back to mongodb://localhost:27017/school_seed_db"
  );
  MONGO = "mongodb://localhost:27017/school_seed_db";
}

console.log("Using Mongo URI (hidden) — connecting...");

let Staff, School;
try {
  Staff = require(modelsPath("staff"));
  School = require(modelsPath("school"));
} catch (e) {
  console.error(
    "Failed to require models from project root. Ensure this script is placed in project_root/scripts and models folder exists at project_root/models."
  );
  console.error(e);
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO, {});

  console.log("Connected.");

  // 1) show staff with username 'akshansh'
  const staffExact = await Staff.findOne({ username: "akshansh" }).lean();
  console.log("\n== Staff record for username='akshansh' ==");
  if (!staffExact) console.log("NOT FOUND");
  else {
    // don't print any full hashes or secrets — print presence flags only
    console.log({
      _id: staffExact._id?.toString(),
      name: staffExact.name,
      username: staffExact.username,
      hasPasswordHash: !!staffExact.passwordHash,
      hasPassword: !!staffExact.password,
    });
  }

  // 2) show first few staff summary for sanity
  const staffSome = await Staff.find({})
    .limit(5)
    .select("username passwordHash password name")
    .lean();
  console.log(
    "\n== First few staff (username / hasPasswordHash / hasPassword) =="
  );
  staffSome.forEach((s) => {
    console.log({
      username: s.username,
      name: s.name,
      hasPasswordHash: !!s.passwordHash,
      hasPassword: !!s.password,
    });
  });

  // 3) show school where principal.username == 'akshansh'
  const schoolByPrincipal = await School.findOne({
    "principal.username": "akshansh",
  }).lean();
  console.log("\n== School where principal.username='akshansh' ==");
  if (!schoolByPrincipal || !schoolByPrincipal.principal) {
    console.log("NOT FOUND");
  } else {
    console.log({
      schoolId: schoolByPrincipal._id?.toString(),
      principalUsername: schoolByPrincipal.principal.username,
      principalHasPasswordHash: !!schoolByPrincipal.principal.passwordHash,
      principalHasPassword: !!schoolByPrincipal.principal.password,
    });
  }

  // 4) bcrypt compare tests (only show true/false, not hashes)
  if (staffExact && (staffExact.passwordHash || staffExact.password)) {
    const hash = staffExact.passwordHash || staffExact.password;
    const ok = await bcrypt.compare("akshansh", hash);
    console.log("\nbcrypt compare('akshansh', staffExact) =>", ok);
  } else {
    console.log("\nNo staffExact hash available to compare.");
  }

  if (
    schoolByPrincipal &&
    schoolByPrincipal.principal &&
    (schoolByPrincipal.principal.passwordHash ||
      schoolByPrincipal.principal.password)
  ) {
    const ph =
      schoolByPrincipal.principal.passwordHash ||
      schoolByPrincipal.principal.password;
    const ok2 = await bcrypt.compare("akshansh", ph);
    console.log("bcrypt compare('akshansh', school.principal) =>", ok2);
  } else {
    console.log("No school principal hash available to compare.");
  }

  // 5) check if staff exists with the same username as school.principal
  if (
    schoolByPrincipal &&
    schoolByPrincipal.principal &&
    schoolByPrincipal.principal.username
  ) {
    const s = await Staff.findOne({
      username: schoolByPrincipal.principal.username,
    }).lean();
    console.log(
      "\nStaff with username equal to school.principal.username =>",
      !!s,
      s ? { username: s.username, _id: s._id?.toString() } : null
    );
  }

  await mongoose.disconnect();
  console.log("\nDisconnected.");
}

run().catch((err) => {
  console.error("ERR:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
