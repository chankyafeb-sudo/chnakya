// models/school.js
const mongoose = require("mongoose");

// Principal subdocument schema (has its own _id and timestamps)
const principalSubSchema = new mongoose.Schema(
  {
    name: { type: String },
    username: { type: String, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, trim: true }, // hashed password (never send in responses)
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    image_url: { type: String, trim: true },
    bio: { type: String, trim: true },
    address: { type: String, trim: true },
    gender: { type: String, trim: true },
    dob: { type: Date },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { _id: true, timestamps: true } // subdoc gets its own _id and createdAt/updatedAt
);

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    school_image: { type: String }, // URL
    mission_statement: { type: String }, // Text
    school_certificate_images: [{ type: String }], // List of URLs

    // principal is embedded subdocument (not separate collection)
    principal: { type: principalSubSchema },

    contact_info: {
      address: { type: String }, // Text
      phone: { type: String }, // Text
      email: { type: String }, // Text
    },
    staff: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("School", schoolSchema);
