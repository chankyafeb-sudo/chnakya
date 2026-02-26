const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    username:{ type: String, required: true },
    password: String,
    name: { type: String, required: true },
    photo: { type: String },
    gender: { type: String },
    experience: { type: String },
    mobile: { type: String },
    email: { type: String },
    about: { type: String },
    address: { type: String },
    dob: { type: Date },
    subject: { type: String },
    achievements: [{ type: String }],
    extraCurricular: { type: String },
    school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }  // ✅ ADDED
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
