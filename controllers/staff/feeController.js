// controllers/staff/feeController.js
const mongoose = require("mongoose");
const Student = require("../../models/student");
const Staff = require("../../models/staff");
const { uploadBuffer } = require("../../utils/cloudinary");

/** Upload multer buffer to Cloudinary */
const uploadBufferToCloudinary = async (
  buffer,
  folder = "student_fee_proofs"
) => {
  if (!buffer) return null;
  const publicId = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const res = await uploadBuffer(buffer, {
    folder,
    public_id: publicId,
    resource_type: "auto",
  });
  return res?.secure_url || res?.url || null;
};

/** Upload base64 string to Cloudinary */
const uploadBase64ToCloudinary = async (
  base64OrDataUrl,
  folder = "student_fee_proofs"
) => {
  if (!base64OrDataUrl) return null;
  const matched = String(base64OrDataUrl).match(/^data:(.+);base64,(.+)$/);
  const base64 = matched ? matched[2] : base64OrDataUrl;
  const buffer = Buffer.from(base64, "base64");
  return await uploadBufferToCloudinary(buffer, folder);
};

/** Safe number parser */
const toNumber = (v) => {
  if (v === null || typeof v === "undefined" || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const putFeeByStudentId = async (req, res) => {
  try {
    const studentId = req.params.studentid;
    console.log("Updating fee for student:", studentId);

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: "Invalid student id" });
    }

    const student = await Student.findById(studentId).exec();
    if (!student) return res.status(404).json({ error: "Student not found" });

    // Ensure fee structure exists
    if (!student.fee) {
      student.fee = {
        total_amount: 0,
        paid_amount: 0,
        pending_amount: 0,
        due_date: null,
        payment_records: [],
      };
    }

    // Extract fields (map Flutter naming to backend fields)
    const body = req.body || {};
    const amount_paid = body.amount_paid ?? body.amount;
    const payment_date = body.payment_date ?? body.paymentDate ?? new Date();
    const mode_of_payment = body.mode_of_payment ?? body.payment_mode;
    const total_amount = body.total_amount ?? body.totalAmount;
    const due_date = body.due_date ?? body.dueDate;
    const staff_id = body.staff_id ?? body.uploader_id ?? body.staffId;

    // Validate staff
    let staffDoc = null;
    if (staff_id) {
      if (!mongoose.Types.ObjectId.isValid(staff_id)) {
        return res.status(400).json({ error: "Invalid staff_id" });
      }
      staffDoc = await Staff.findById(staff_id).select("_id name").lean();
      if (!staffDoc) {
        return res.status(404).json({ error: "Staff (uploader) not found" });
      }
    }

    // Update total/due date
    const parsedTotal = toNumber(total_amount);
    if (parsedTotal !== null) {
      if (parsedTotal < 0)
        return res
          .status(400)
          .json({ error: "total_amount cannot be negative" });
      student.fee.total_amount = parsedTotal;
    }

    if (due_date) {
      const parsedDue = new Date(due_date);
      if (isNaN(parsedDue.getTime()))
        return res.status(400).json({ error: "Invalid due_date format" });
      student.fee.due_date = parsedDue;
    }

    // Create payment record
    const parsedAmt = toNumber(amount_paid);
    if (parsedAmt === null)
      return res.status(400).json({ error: "amount_paid is required" });

    const payDate = new Date(payment_date);
    if (isNaN(payDate.getTime()))
      return res.status(400).json({ error: "Invalid payment_date" });

    const newRecord = {
      amount_paid: parsedAmt,
      payment_date: payDate,
      mode_of_payment: mode_of_payment || "",
    };

    if (staffDoc) {
      newRecord.uploaded_by = staffDoc._id;
      newRecord.uploaded_by_name = staffDoc.name;
      newRecord.uploaded_at = new Date();
    }

    // --- Proof Upload ---
    let proofUrl = null;

    // Accept multiple possible field names (primary: payment_proof)
    const fileObj =
      req.files?.payment_proof?.[0] ||
      req.files?.payment_proof_file?.[0] ||
      req.files?.payment_receipt?.[0] ||
      req.files?.proof?.[0] ||
      req.files?.file?.[0] ||
      null;

    if (fileObj && fileObj.buffer) {
      try {
        proofUrl = await uploadBufferToCloudinary(
          fileObj.buffer,
          "student_fee_proofs"
        );
        console.log("Cloudinary uploaded (file):", proofUrl);
      } catch (e) {
        console.error("Cloudinary upload failed (file):", e);
        return res.status(500).json({ error: "Failed to upload proof file" });
      }
    }

    // Base64 fallback
    if (!proofUrl && (body.payment_proof_base64 || body.proof_base64)) {
      try {
        proofUrl = await uploadBase64ToCloudinary(
          body.payment_proof_base64 ?? body.proof_base64,
          "student_fee_proofs"
        );
        console.log("Cloudinary uploaded (base64):", proofUrl);
      } catch (e) {
        console.error("Cloudinary upload failed (base64):", e);
        return res.status(500).json({ error: "Failed to upload base64 proof" });
      }
    }

    // If only local path was provided, return helpful error
    if (!proofUrl && body.payment_proof_file && body.payment_proof_file.path) {
      return res.status(400).json({
        error: "proof_file_not_uploaded",
        message:
          "Client provided only a local device path (payment_proof_file.path). Server cannot access client's filesystem. Ask client to send actual file bytes (multipart/form-data field 'payment_proof') or a base64 string ('payment_proof_base64').",
      });
    }

    if (proofUrl) {
      newRecord.payment_proof = proofUrl; // save URL to schema field
    }

    // Update student's fee
    student.fee.payment_records.push(newRecord);
    student.fee.paid_amount = (student.fee.paid_amount || 0) + parsedAmt;

    const total = student.fee.total_amount || 0;
    student.fee.pending_amount = Math.max(0, total - student.fee.paid_amount);

    if (staffDoc) {
      student.fee.uploaded_by = staffDoc._id;
      student.fee.uploaded_by_name = staffDoc.name;
      student.fee.uploaded_at = new Date();
    }

    await student.save();

    return res.status(200).json({
      message: "Student fee updated successfully",
      studentId: String(student._id),
      fee: student.fee,
    });
  } catch (err) {
    console.error("putFeeByStudentId error:", err && (err.stack || err));
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { putFeeByStudentId };
