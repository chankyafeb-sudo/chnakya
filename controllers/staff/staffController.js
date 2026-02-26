// controllers/student/postAddNewStudentByClassId.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Student = require("../../models/student");
const ClassModel = require("../../models/class");
const Staff = require("../../models/staff");
const { uploadBuffer, cloudinary } = require("../../utils/cloudinary"); // ensure these exports exist

// Hash helper
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

const postAddNewStudentByClassId = async (req, res) => {
  try {
    // Accept common param names: staffid, staff_id, id, staff
    const staffParam =
      req.params.staffid ||
      req.params.staff_id ||
      req.params.id ||
      req.params.staff;
    console.log("POST create student for staffParam (param):", staffParam);
    // don't log password or sensitive fields
    // console.log("Incoming request body:", JSON.stringify(req.body, null, 2));

    if (!staffParam || !mongoose.Types.ObjectId.isValid(staffParam)) {
      return res.status(400).json({ error: "Invalid staff id (param)" });
    }
    const staffObjectId = new mongoose.Types.ObjectId(staffParam);

    // Verify staff exists
    const staffExists = await Staff.findById(staffObjectId)
      .select("_id name")
      .lean()
      .exec();
    if (!staffExists) {
      return res.status(404).json({ error: "Staff not found" });
    }

    // Find class where this staff is the class_teacher
    // If multiple classes exist, pick the first — change logic if you want otherwise.
    const classDoc = await ClassModel.findOne({ class_teacher: staffObjectId })
      .select("_id class_name students")
      .lean()
      .exec();

    if (!classDoc) {
      return res
        .status(404)
        .json({ error: "No class found for this staff (not a class teacher)" });
    }

    // Extract fields from body
    const {
      name,
      username,
      password,
      rollnumber = "",
      photo = "",
      batch = "",
      gender = "",
      mobile = "",
      email,
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Student name is required" });
    }
    if (!username || !String(username).trim()) {
      return res.status(400).json({ error: "Username is required" });
    }

    const normalizedUsername = String(username).trim().toLowerCase();

    // Pre-check username uniqueness for friendly error (DB unique index is the source of truth)
    const existing = await Student.findOne({ username: normalizedUsername })
      .lean()
      .exec();
    if (existing) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash password if provided
    let passwordHash = "";
    if (password && String(password).trim()) {
      try {
        passwordHash = await hashPassword(String(password).trim());
      } catch (hashErr) {
        console.error("Password hash error:", hashErr);
        return res.status(500).json({ error: "Failed to hash password" });
      }
    }

    // Handle photo: multer memoryBuffer -> uploadBuffer, or accept URL / cloudinary id
    let photoUrl = "";
    if (req.file && req.file.buffer) {
      try {
        const uploadResult = await uploadBuffer(req.file.buffer, {
          folder: "students",
          resource_type: "image",
        });
        if (uploadResult && uploadResult.secure_url)
          photoUrl = uploadResult.secure_url;
        else if (uploadResult && uploadResult.url) photoUrl = uploadResult.url;
      } catch (uErr) {
        console.error("Cloudinary upload error:", uErr);
        return res.status(500).json({ error: "Failed to upload photo" });
      }
    } else if (photo && typeof photo === "string" && photo.trim()) {
      const p = photo.trim();
      if (/^https?:\/\//i.test(p)) {
        photoUrl = p;
      } else {
        try {
          // build cloudinary url from public_id if desired
          photoUrl = cloudinary.url(p, {
            secure: true,
            resource_type: "image",
            folder: "students",
          });
        } catch (e) {
          console.warn(
            "Could not build cloudinary url from provided photo string:",
            e
          );
          photoUrl = p; // fallback: store raw string
        }
      }
    }

    // Prepare payload
    const studentPayload = {
      name: String(name).trim(),
      username: normalizedUsername,
      password: passwordHash, // hashed (or empty string if not provided)
      rollnumber: rollnumber ? String(rollnumber) : "",
      photo: photoUrl || "",
      batch: batch ? String(batch) : "",
      class_id: new mongoose.Types.ObjectId(classDoc._id),
      gender: gender ? String(gender) : "",
      mobile: mobile ? String(mobile) : "",
      email: email ? String(email).toLowerCase().trim() : "",
      attendance: [],
      assignments: [],
      fee: {
        total_amount: 0,
        paid_amount: 0,
        pending_amount: 0,
        due_date: null,
        uploaded_by: staffExists._id,
        uploaded_by_name: staffExists.name,
        uploaded_at: new Date(),
        payment_records: [],
      },
      certificates: [],
      isBlocked: false,
      failedLoginAttempts: 0,
      otpAttempts: 0,
      blockedIps: [],
      blockedMacs: [],
    };

    // Create student (race-safe handling for duplicate key)
    let createdStudent;
    try {
      createdStudent = await Student.create(studentPayload);
    } catch (createErr) {
      console.error(
        "Error creating student:",
        createErr && (createErr.stack || createErr)
      );
      // duplicate key race-case fallback
      if (
        createErr.code === 11000 &&
        createErr.keyPattern &&
        createErr.keyPattern.username
      ) {
        return res.status(409).json({ error: "Username already exists" });
      }
      if (createErr.name === "ValidationError") {
        return res
          .status(400)
          .json({ error: "Validation error", details: createErr.errors });
      }
      throw createErr;
    }

    // Append to class.students
    const updatedClass = await ClassModel.findByIdAndUpdate(
      classDoc._id,
      { $push: { students: createdStudent._id } },
      { new: true }
    )
      .select("_id class_name students")
      .lean()
      .exec();

    return res.status(201).json({
      message: "Student created and associated with class",
      student: {
        id: String(createdStudent._id),
        name: createdStudent.name,
        username: createdStudent.username,
        class_id: String(createdStudent.class_id),
        photo: createdStudent.photo || "",
      },
      class: {
        id: String(updatedClass._id),
        name: updatedClass.class_name || "",
        studentsCount: Array.isArray(updatedClass.students)
          ? updatedClass.students.length
          : 0,
      },
    });
  } catch (err) {
    console.error(
      "postAddNewStudentByClassId error:",
      err && (err.stack || err)
    );
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { postAddNewStudentByClassId };
     