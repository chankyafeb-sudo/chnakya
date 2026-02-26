const mongoose = require('mongoose');
const classSchema = new mongoose.Schema({
    class_name: String,
    year: Number,
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    class_teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
    books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    timetables: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' }] // Ensure this is included
});
module.exports = mongoose.model('Class', classSchema);