// debug-principal.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const MONGO_URI = (
  process.env.MONGO_URI || "mongodb://localhost:27017/school_seed_db"
).trim();

// adjust model paths if your project uses different names
const Staff = require("./models/staff");
const School = require("./models/school");

async function run() {
  await mongoose.connect(MONGO_URI);

  console.log("Connected to", MONGO_URI);

  // 1) find staff with username 'akshansh'
  const staff = await Staff.findOne({ username: "akshansh" }).lean();
  console.log("\nStaff.findOne({username: 'akshansh'}) =>", !!staff);
  if (staff) {
    console.log({
      _id: staff._id?.toString(),
      name: staff.name,
      username: staff.username,
      passwordHash: !!staff.passwordHash,
    });
    if (staff.passwordHash) {
      const ok = await bcrypt.compare("akshansh", staff.passwordHash);
      console.log("bcrypt compare (staff) with 'akshansh' =>", ok);
    } else {
      console.log("staff.passwordHash missing");
    }
  }

  // 2) find school whose principal.username = 'akshansh'
  const school = await School.findOne({
    "principal.username": "akshansh",
  }).lean();
  console.log(
    "\nSchool.findOne({'principal.username':'akshansh'}) =>",
    !!school
  );
  if (school && school.principal) {
    console.log("school.principal =>", {
      name: school.principal.name,
      username: school.principal.username,
      passwordHashExists: !!school.principal.passwordHash,
    });
    if (school.principal.passwordHash) {
      const ok2 = await bcrypt.compare(
        "akshansh",
        school.principal.passwordHash
      );
      console.log("bcrypt compare (school.principal) with 'akshansh' =>", ok2);
    }
  }

  // 3) Print first 5 staff usernames for sanity
  const some = await Staff.find({}).limit(5).select("username name").lean();
  console.log("\nFirst few staff entries:", some);

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch((err) => {
  console.error("ERR:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
