const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    date: { type: Date, required: true },
    status: { type: String, required: true },
    notes: { type: String }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
