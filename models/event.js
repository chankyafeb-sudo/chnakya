// models/Event.js
const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    image: { type: String, trim: true }, // Cloudinary image URL (main)
    image_public_id: { type: String, trim: true }, // optional: store Cloudinary public_id for easy deletion
    title: { type: String, required: true },
    description: { type: String, required: true },
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    event_coordinator: { type: String, required: true },
    schedule: { type: String, required: true },
    chief_guest: { type: String },
    tags: [{ type: String, trim: true }],

    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    created_by_name: { type: String, trim: true },

    // ✅ NEW: optional link to online page, or event URL
    event_url: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", EventSchema);
