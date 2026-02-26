// controllers/staff/eventController.js
const mongoose = require("mongoose");
const Event = require("../../models/event");
const Staff = require("../../models/staff");
const School = require("../../models/school");
const { uploadBuffer } = require("../../utils/cloudinary");

const uploadBufferToCloudinary = async (buffer, folder = "events") => {
  if (!buffer) return null;
  const publicId = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const res = await uploadBuffer(buffer, {
    folder,
    public_id: publicId,
    resource_type: "auto",
  });
  return res?.secure_url || res?.url || null;
};

// ✅ NEW: Get all events by school ID
const getEventsBySchoolId = async (req, res) => {
  console.log('\n========================================');
  console.log('📅 GET EVENTS BY SCHOOL ID');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('School ID:', req.params.schoolid);

  try {
    const schoolId = req.params.schoolid;

    if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
      console.log('❌ Invalid school ID');
      return res.status(400).json({ 
        success: false,
        error: "Invalid school id" 
      });
    }

    const schoolObjectId = new mongoose.Types.ObjectId(schoolId);

    // Optional: Verify school exists
    if (School) {
      const schoolDoc = await School.findById(schoolObjectId).select("_id name").lean().exec();
      if (!schoolDoc) {
        console.log('❌ School not found');
        return res.status(404).json({ 
          success: false,
          error: "School not found" 
        });
      }
      console.log(`✅ School found: ${schoolDoc.name}`);
    }

    // Find all events for this school
    const events = await Event.find({ school_id: schoolObjectId })
      .select('image title description date location event_coordinator schedule chief_guest tags created_by created_by_name')
      .sort({ date: -1 }) // Newest first
      .lean()
      .exec();

    console.log(`✅ Found ${events.length} events for school ${schoolId}`);
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      count: events.length,
      events: events
    });

  } catch (err) {
    console.error('❌ GET EVENTS BY SCHOOL ERROR:', err.message);
    console.error('Stack:', err.stack);
    return res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

const postEventBySchoolId = async (req, res) => {
  try {
    const schoolId = req.params.schoolid;
    if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({ error: "Invalid school id" });
    }
    const schoolObjectId = new mongoose.Types.ObjectId(schoolId);

    // optional school existence check
    if (School) {
      const schoolDoc = await School.findById(schoolObjectId).select("_id name").lean().exec();
      if (!schoolDoc) return res.status(404).json({ error: "School not found" });
    }

    // incoming body fields
    const {
      title,
      description,
      date,
      location,
      event_coordinator,
      schedule,
      chief_guest = "",
      tags = [],
      created_by, // staff id
      image: imageFromBody // allow client to pass image URL in body as fallback
    } = req.body || {};

    if (!title || !description || !date || !location || !event_coordinator || !schedule) {
      return res.status(400).json({ error: "Missing required event fields" });
    }

    if (!created_by || !mongoose.Types.ObjectId.isValid(created_by)) {
      return res.status(400).json({ error: "Missing or invalid created_by (staff id)" });
    }

    const staffObjectId = new mongoose.Types.ObjectId(created_by);
    const staffDoc = await Staff.findById(staffObjectId).select("_id name").lean().exec();
    if (!staffDoc) return res.status(404).json({ error: "Staff (creator) not found" });

    // Normalize tags
    let tagsArray = [];
    if (Array.isArray(tags)) tagsArray = tags.map(t => String(t).trim()).filter(Boolean);
    else if (typeof tags === "string") tagsArray = tags.split(",").map(t => t.trim()).filter(Boolean);

    // --- handle file upload (req.file.buffer) or base64 fields ---
    let imageUrl = imageFromBody ? String(imageFromBody).trim() : "";
    const fileObj = req.file || null;

    if (fileObj && fileObj.buffer) {
      try {
        const uploaded = await uploadBufferToCloudinary(fileObj.buffer, "events");
        if (uploaded) imageUrl = uploaded;
        console.log("[postEventBySchoolId] uploaded image ->", uploaded);
      } catch (e) {
        console.error("[postEventBySchoolId] image upload failed:", e);
        return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
      }
    }

    // base64 fallback (if client sends event_image_base64)
    if (!imageUrl && (req.body.event_image_base64 || req.body.image_base64)) {
      try {
        const base64OrDataUrl = req.body.event_image_base64 ?? req.body.image_base64;
        const matched = String(base64OrDataUrl).match(/^data:(.+);base64,(.+)$/);
        const base64 = matched ? matched[2] : base64OrDataUrl;
        const buffer = Buffer.from(base64, "base64");
        const uploaded = await uploadBufferToCloudinary(buffer, "events");
        if (uploaded) imageUrl = uploaded;
        console.log("[postEventBySchoolId] uploaded base64 ->", uploaded);
      } catch (e) {
        console.error("[postEventBySchoolId] base64 upload failed:", e);
        return res.status(500).json({ error: "Failed to upload base64 image to Cloudinary" });
      }
    }

    const eventPayload = {
      image: imageUrl || "",
      title: String(title).trim(),
      description: String(description).trim(),
      school_id: schoolObjectId,
      date: new Date(date),
      location: String(location).trim(),
      event_coordinator: String(event_coordinator).trim(),
      schedule: String(schedule).trim(),
      chief_guest: chief_guest ? String(chief_guest).trim() : "",
      tags: tagsArray,
      created_by: staffObjectId,
      created_by_name: staffDoc.name || ""
    };

    const createdEvent = await Event.create(eventPayload);

    // optional: push to school's events array if supported
    if (School) {
      try {
        await School.findByIdAndUpdate(
          schoolObjectId,
          { $addToSet: { events: createdEvent._id } },
          { new: true }
        ).exec();
      } catch (err) {
        console.log("School events append skipped/failed:", err && err.message);
      }
    }

    return res.status(201).json({
      message: "Event created successfully",
      event: {
        id: String(createdEvent._id),
        title: createdEvent.title,
        image: createdEvent.image,
        school_id: String(createdEvent.school_id),
        date: createdEvent.date,
        location: createdEvent.location,
        created_by: String(createdEvent.created_by),
        created_by_name: createdEvent.created_by_name
      }
    });
  } catch (err) {
    console.error("postEventBySchoolId error:", err && (err.stack || err));
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { 
  postEventBySchoolId,
  getEventsBySchoolId  // ✅ Export new function
};