// models/Assignment.js
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Submitted", "Graded"],
    required: true,
  },
  submission_date: { type: Date },
  obtained_grade: { type: String }, // Optional, only for 'Graded' status
});

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },

  // NEW: subject of the assignment (e.g., "Mathematics", "Physics")
  subject: { type: String, trim: true, default: "" },

  // NEW: difficulty level: Easy | Medium | Hard
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium",
  },
  max_marks:{type:String},

  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  dueDate: { type: Date, required: true },
  submissions: [submissionSchema],
});

module.exports = mongoose.model("Assignment", assignmentSchema);
