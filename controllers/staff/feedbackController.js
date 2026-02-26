const mongoose = require("mongoose");
const Feedback = require("../../models/feedback"); // adjust path if needed
const Student = require("../../models/student"); // adjust path if needed
const Staff = require("../../models/staff"); // adjust path if needed

const postFeedbackByStaffId = async (req, res) => {
  try {
    const staffId = req.params.staffid || req.params.staff_id || req.params.id;
    console.log("Incoming POST feedback - staffId (param):", staffId);
    console.log("Incoming request body:", JSON.stringify(req.body, null, 2));

    // Validate staff id
    if (!staffId || !mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ error: "Invalid staff id" });
    }
    const staffObjectId = new mongoose.Types.ObjectId(staffId);

    // Extract body fields
    const { student, title, description, rating } = req.body || {};

    // Basic validation
    if (!student || !mongoose.Types.ObjectId.isValid(student)) {
      return res.status(400).json({ error: "Invalid or missing student id in body" });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: "description is required" });
    }
    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: "rating is required and must be a number between 1 and 5" });
    }

    // Confirm staff exists
    const staffDoc = await Staff.findById(staffObjectId).select("_id name").lean().exec();
    if (!staffDoc) {
      console.log("Staff not found for id:", staffId);
      return res.status(404).json({ error: "Staff not found" });
    }

    // Confirm student exists
    const studentObjectId = new mongoose.Types.ObjectId(student);
    const studentDoc = await Student.findById(studentObjectId).select("_id name").lean().exec();
    if (!studentDoc) {
      console.log("Student not found for id:", student);
      return res.status(404).json({ error: "Student not found" });
    }

    // Build feedback payload
    const feedbackPayload = {
      student: studentObjectId,
      staff: staffObjectId,
      title: String(title).trim(),
      description: String(description).trim(),
      rating: parsedRating
    };

    console.log("Feedback payload to save:", JSON.stringify(feedbackPayload, null, 2));

    // Create feedback
    const createdFeedback = await Feedback.create(feedbackPayload);
    console.log("Saved Feedback:", JSON.stringify(createdFeedback, null, 2));

    return res.status(201).json({
      message: "Feedback created",
      feedback: {
        id: String(createdFeedback._id),
        student: String(createdFeedback.student),
        staff: String(createdFeedback.staff),
        title: createdFeedback.title,
        description: createdFeedback.description,
        rating: createdFeedback.rating,
        createdAt: createdFeedback.createdAt
      }
    });
  } catch (err) {
    console.error("postFeedbackByStaffId error:", err && (err.stack || err));
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { postFeedbackByStaffId };
