const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
    class_teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true }, // Reference to the class teacher
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true }, // Reference to the class
    date: { type: Date, required: true }, // Date of the interaction
    time: { type: String, required: true }, // Time of the interaction (could be stored as a string or Date depending on the use case)
    reason: { type: String, required: true } // Reason for the interaction
});

module.exports = mongoose.model('Interaction', InteractionSchema);
