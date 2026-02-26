const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  name:       String,
  username:   { type: String, unique: true },
  password:   String,
  rollnumber: String,
  photo:      String,
  batch:      String,
  gender:     String,
  mobile:     String,
  email:      String,
  dob:        Date,
  address:    String,
  father_name: String,
  mother_name: String,
  school_id:  { type: mongoose.Schema.Types.ObjectId, ref: "School" },
  class_id:   { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  created_by_name: String,
  created_at: { type: Date, default: Date.now },

  attendance: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attendance" }],

  assignments: [{
    assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
    status: String
  }],

  fee: {
    total_amount:   Number,
    paid_amount:    Number,
    pending_amount: Number,
    due_date:       Date,
    uploaded_by:      { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    uploaded_by_name: String,
    uploaded_at:      { type: Date, default: Date.now },
    payment_records: [{
      amount_paid:     Number,
      payment_date:    Date,
      mode_of_payment: String,
      payment_proof:   String,
      uploaded_by:     { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      uploaded_by_name: String,
      uploaded_at:     { type: Date, default: Date.now }
    }]
  },

  certificates: [{
    certificate_image: String,
    issue_date:  Date,
    title:       String,
    awarded_by:  String,
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    uploaded_by_name: String,
    uploaded_at: { type: Date, default: Date.now }
  }],

  isBlocked:          { type: Boolean, default: false },
  failedLoginAttempts:{ type: Number,  default: 0 },
  otp:            String,
  otpExpires:     Date,
  otpAttempts:    { type: Number, default: 0 },
  otpBlockExpires: Date,
  blockedIps:     [String],
  blockedMacs:    [String]
});

module.exports = mongoose.model("Student", StudentSchema, "students");
