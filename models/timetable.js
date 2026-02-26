const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    duration: { type: Number }, // Duration in minutes
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }
});

// Middleware to calculate duration before saving
timetableSchema.pre('save', function(next) {
    if (this.start_time && this.end_time) {
        const duration = (this.end_time - this.start_time) / 60000; // Duration in minutes
        this.duration = duration;
    }
    next();
});

module.exports = mongoose.model('Timetable', timetableSchema);
