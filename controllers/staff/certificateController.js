const mongoose = require("mongoose");
const Student = require("../../models/student");
const Staff = require("../../models/staff"); // adjust path if needed

const putCertificateByStudentId = async (req, res) => {
  try {
    const studentId =
      req.params.studentid || req.params.student_id || req.params.id;
    console.log("PUT certificate request for studentId (param):", studentId);
    console.log("Incoming request body:", JSON.stringify(req.body, null, 2));

    // validate student id
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: "Invalid student id" });
    }
    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    // validate and fetch student
    const studentDoc = await Student.findById(studentObjectId).exec();
    if (!studentDoc) {
      console.log("Student not found for id:", studentId);
      return res.status(404).json({ error: "Student not found" });
    }

    // Extract body fields
    const {
      staff_id, // required: who uploaded the certificate
      certificate_image, // URL/string - recommended required
      title, // certificate title - recommended required
      issue_date, // optional - ISO string
      awarded_by, // optional - e.g., organization/person who awarded
      notes, // optional - any extra notes
    } = req.body || {};

    if (!staff_id || !mongoose.Types.ObjectId.isValid(staff_id)) {
      return res
        .status(400)
        .json({ error: "Missing or invalid staff_id in request body" });
    }
    if (
      !certificate_image ||
      typeof certificate_image !== "string" ||
      !certificate_image.trim()
    ) {
      return res.status(400).json({ error: "certificate_image is required" });
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }

    const staffObjectId = new mongoose.Types.ObjectId(staff_id);

    // Fetch staff to get name (snapshot)
    const staffDoc = await Staff.findById(staffObjectId)
      .select("_id name")
      .lean()
      .exec();
    if (!staffDoc) {
      console.log("Staff (creator) not found for id:", staff_id);
      return res.status(404).json({ error: "Staff (creator) not found" });
    }
    console.log("Found staff (uploader):", JSON.stringify(staffDoc, null, 2));

    // Prepare certificate entry
    const certEntry = {
      certificate_image: String(certificate_image).trim(),
      issue_date: issue_date ? new Date(issue_date) : null,
      title: String(title).trim(),
      awarded_by: awarded_by ? String(awarded_by).trim() : "",
      uploaded_by: staffObjectId,
      uploaded_by_name: staffDoc.name || "",
      notes: notes ? String(notes) : "",
    };

    // Ensure student.certificates array exists
    if (!Array.isArray(studentDoc.certificates)) studentDoc.certificates = [];

    // Push new certificate and save
    studentDoc.certificates.push(certEntry);
    const saved = await studentDoc.save();

    // Log what we saved (only certificates portion for brevity)
    console.log(
      "Added certificate entry for student:",
      String(studentObjectId)
    );
    console.log("New certificate entry:", JSON.stringify(certEntry, null, 2));
    console.log(
      "Updated certificates count:",
      saved.certificates ? saved.certificates.length : 0
    );

    // Return updated certificates
    return res.status(201).json({
      message: "Certificate added to student",
      studentId: String(saved._id),
      certificates: saved.certificates,
    });
  } catch (err) {
    console.error(
      "putCertificateByStudentId error:",
      err && (err.stack || err)
    );
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { putCertificateByStudentId };
