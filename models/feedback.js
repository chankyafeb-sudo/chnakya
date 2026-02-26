// models/feedback.js
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },  // Reference to Staff (Teacher)
    title: { type: String, required: true },
    description: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
