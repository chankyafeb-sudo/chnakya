const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },  // ✅ ADDED
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },  // ✅ ADDED (optional)
    date: { type: Date, required: true },
    status: { type: String, required: true },
    notes: { type: String }
});

module.exports = mongoose.model('Attendance', attendanceSchema);