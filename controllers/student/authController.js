// controllers/student/authController.js  (updated)
//
// Replaces your existing controller file. Changes:
// - Use fallback for password fields: passwordHash || password
// - Minor logging and safety checks retained
// - principalLogin made robust to accept principal.password if present

const Student = require("../../models/student");
const Notification = require("../../models/notification");
const School = require("../../models/school");
const Staff = require("../../models/staff");
const Class = require("../../models/class");
const { hashedPassword, comparePassword } = require("../../utils/password");
const { generateOTP, verifyOTP, generateToken } = require("../../utils/auth");
const { sendEmail } = require("../../utils/email");

const login = async (req, res) => {
  console.time("login");
  console.debug(
    `[${new Date().toISOString()}] Request received for login:`,
    req.body
  );

  const { username, password } = req.body;

  try {
    const student = await Student.findOne({ username })
      .populate("class_id")
      .exec();
    if (!student) {
      console.error(
        `[${new Date().toISOString()}] User not found: ${username}`
      );
      return res.status(404).json({ message: "User not found" });
    }

    if (student.isBlocked) {
      console.error(
        `[${new Date().toISOString()}] User is blocked: ${username}`
      );
      return res.status(403).json({ message: "User is blocked" });
    }

    // Support both field names: passwordHash (recommended) or password (legacy)
    const studentHash = student.passwordHash || student.password;
    const isMatch = await comparePassword(password, studentHash);
    if (!isMatch) {
      student.failedLoginAttempts = (student.failedLoginAttempts || 0) + 1;
      if (student.failedLoginAttempts >= 3) {
        student.isBlocked = true;
        console.error(
          `[${new Date().toISOString()}] User blocked due to multiple failed login attempts: ${username}`
        );
      }
      await student.save();
      console.error(
        `[${new Date().toISOString()}] Invalid credentials: ${username}`
      );
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Login success (no OTP)
    student.failedLoginAttempts = 0;
    await student.save();

    const token = generateToken(student._id);
    console.debug(
      `[${new Date().toISOString()}] Generated token for user: ${username}`,
      token
    );

    const studentClass = student.class_id;
    const schoolId = studentClass ? studentClass.school_id : null;

    const notifications = studentClass
      ? await Notification.find({ class_id: studentClass._id })
      : [];
    const schoolData = schoolId
      ? await School.findOne({ _id: schoolId })
      : null;
    const classTeacher = studentClass
      ? await Staff.findOne({ _id: studentClass.class_teacher }).exec()
      : null;

    const fees = student.fee
      ? {
          total: student.fee.total_amount || 0,
          pending: student.fee.pending_amount || 0,
          completed: student.fee.paid_amount || 0,
        }
      : { total: 0, pending: 0, completed: 0 };

    console.timeEnd("login");
    res.status(200).json({
      message: "Login successful",
      token,
      student_id: student._id,
      studentData: {
        name: student.name,
        username: student.username,
        rollnumber: student.rollnumber,
        photo: student.photo,
        batch: student.batch,
        class: studentClass ? studentClass.class_name : null,
        gender: student.gender,
        mobile: student.mobile,
        email: student.email,
        dob: student.dob,
      },
      notifications: notifications
        ? notifications.map((n) => ({
            title: n.title,
            description: n.description,
          }))
        : [],
      classTeacher: classTeacher
        ? {
            name: classTeacher.name,
            photo: classTeacher.photo,
          }
        : {},
      fees,
      school: schoolData
        ? {
            name: schoolData.name,
            logo: schoolData.school_image,
            school_certificate_images: schoolData.school_certificate_images,
          }
        : {},
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error logging in:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

// staff login
const staffLogin = async (req, res) => {
  console.time("staffLogin");
  console.debug(`[${new Date().toISOString()}] Staff login request:`, req.body);

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "username and password required" });
  }

  try {
    const staff = await Staff.findOne({ username }).exec();
    if (!staff) {
      console.error(
        `[${new Date().toISOString()}] Staff not found: ${username}`
      );
      return res.status(404).json({ message: "Staff not found" });
    }

    // support both possible field names: passwordHash (recommended) or password (legacy)
    const staffHash = staff.passwordHash || staff.password;
    const isMatch = await comparePassword(password, staffHash);
    if (!isMatch) {
      console.error(
        `[${new Date().toISOString()}] Invalid credentials (staff): ${username}`
      );
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(staff._id);

    // Find the school this staff belongs to (if any)
    const schoolData = await School.findOne({ staff: staff._id }).exec();

    // Prepare response data (only school name included)
    const responseData = {
      message: "Login successful",
      role: "staff",
      token,
      staff_id: staff._id,
      staffData: {
        name: staff.name,
        username: staff.username,
        photo: staff.photo,
        gender: staff.gender,
        experience: staff.experience,
        mobile: staff.mobile,
        email: staff.email,
        about: staff.about,
        address: staff.address,
        dob: staff.dob,
        subject: staff.subject,
        achievements: staff.achievements || [],
        extraCurricular: staff.extraCurricular || "",
      },
      school: schoolData
        ? { name: schoolData.name, school_id: schoolData._id }
        : {},
    };

    // ✅ Console log the exact response data for debugging
    console.log(
      "[staffLogin] Sending response:",
      JSON.stringify(responseData, null, 2)
    );

    console.timeEnd("staffLogin");
    return res.status(200).json(responseData);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] staffLogin error:`, err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP and login user
const verifyUser = async (req, res) => {
  console.time("verifyOTP");
  console.debug(
    `[${new Date().toISOString()}] Request received for OTP verification:`,
    req.body
  );

  const { username, otp } = req.body;

  try {
    const student = await Student.findOne({ username })
      .populate("class_id")
      .exec();
    if (!student) {
      console.error(
        `[${new Date().toISOString()}] User not found: ${username}`
      );
      return res.status(404).json({ message: "User not found" });
    }

    if (student.isBlocked) {
      console.error(
        `[${new Date().toISOString()}] User is blocked: ${username}`
      );
      return res.status(403).json({ message: "User is blocked" });
    }

    if (student.otpAttempts >= 3) {
      console.error(
        `[${new Date().toISOString()}] OTP attempts exceeded for user: ${username}`
      );
      return res.status(403).json({ message: "Too many OTP attempts" });
    }

    if (new Date() > student.otpExpires) {
      console.error(
        `[${new Date().toISOString()}] OTP expired for user: ${username}`
      );
      return res.status(400).json({ message: "OTP expired" });
    }

    const isValidOTP = verifyOTP(student.otp, otp);
    if (!isValidOTP) {
      student.otpAttempts += 1;
      await student.save();
      console.error(
        `[${new Date().toISOString()}] Invalid OTP for user: ${username}`
      );
      return res.status(400).json({ message: "Invalid OTP" });
    }

    student.otp = undefined;
    student.otpExpires = undefined;
    student.otpAttempts = 0;
    await student.save();

    const token = generateToken(student._id);
    console.debug(
      `[${new Date().toISOString()}] Generated token for user: ${username}`,
      token
    );

    const studentClass = student.class_id;
    const schoolId = studentClass ? studentClass.school_id : null;

    // Retrieve notifications based on class_id
    const notifications = studentClass
      ? await Notification.find({ class_id: studentClass._id })
      : [];
    console.debug(
      `[${new Date().toISOString()}] Notifications retrieved:`,
      notifications
    );

    // Fee is now part of the Student schema
    const fees = {
      total: student.fee ? student.fee.total_amount || 0 : 0,
      pending: student.fee ? student.fee.pending_amount || 0 : 0,
      completed: student.fee ? student.fee.paid_amount || 0 : 0,
    };
    console.debug(`[${new Date().toISOString()}] Fees retrieved:`, fees);

    const schoolData = schoolId
      ? await School.findOne({ _id: schoolId })
      : null;
    console.debug(
      `[${new Date().toISOString()}] School retrieved:`,
      schoolData
    );

    const classTeacher = studentClass
      ? await Staff.findOne({ _id: studentClass.class_teacher }).exec()
      : null;
    console.debug(
      `[${new Date().toISOString()}] ClassTeacher retrieved:`,
      classTeacher
    );

    console.timeEnd("verifyOTP");
    res.status(200).json({
      message: "OTP verified",
      token,
      student_id: student._id,
      studentData: {
        name: student.name,
        username: student.username,
        rollnumber: student.rollnumber,
        photo: student.photo,
        batch: student.batch,
        class: studentClass ? studentClass.class_name : null,
        gender: student.gender,
        mobile: student.mobile,
        email: student.email,
        dob: student.dob,
      },
      notifications: notifications
        ? notifications.map((n) => ({
            title: n.title,
            description: n.description,
          }))
        : [],
      classTeacher: classTeacher
        ? {
            name: classTeacher.name,
            photo: classTeacher.photo,
          }
        : {},
      fees,
      school: schoolData
        ? {
            name: schoolData.name,
            logo: schoolData.school_image,
            school_certificate_images: schoolData.school_certificate_images,
          }
        : {},
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error verifying OTP:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

// Change password
const changePassword = async (req, res) => {
  console.time("changePassword");
  console.debug(
    `[${new Date().toISOString()}] Request received for password change:`,
    req.body
  );

  const { username, otp, newPassword } = req.body;

  try {
    const student = await Student.findOne({ username });
    if (!student) {
      console.error(
        `[${new Date().toISOString()}] User not found: ${username}`
      );
      return res.status(404).json({ message: "User not found" });
    }

    if (student.isBlocked) {
      console.error(
        `[${new Date().toISOString()}] User is blocked: ${username}`
      );
      return res.status(403).json({ message: "User is blocked" });
    }

    if (student.otpAttempts >= 3) {
      console.error(
        `[${new Date().toISOString()}] OTP attempts exceeded for user: ${username}`
      );
      return res.status(403).json({ message: "Too many OTP attempts" });
    }

    if (new Date() > student.otpExpires) {
      console.error(
        `[${new Date().toISOString()}] OTP expired for user: ${username}`
      );
      return res.status(400).json({ message: "OTP expired" });
    }

    const isValidOTP = verifyOTP(student.otp, otp);
    if (!isValidOTP) {
      student.otpAttempts += 1;
      await student.save();
      console.error(
        `[${new Date().toISOString()}] Invalid OTP for user: ${username}`
      );
      return res.status(400).json({ message: "Invalid OTP" });
    }

    student.password = await hashedPassword(newPassword);
    student.otp = undefined;
    student.otpExpires = undefined;
    student.otpAttempts = 0;
    await student.save();

    console.timeEnd("changePassword");
    res.status(200).json({
      message: "Password changed successfully",
      studentId: student._id,
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error changing password:`,
      error
    );
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  console.time("forgotPassword");
  console.debug(
    `[${new Date().toISOString()}] Request received for forgot password:`,
    req.body
  );

  const { username } = req.body;

  try {
    const student = await Student.findOne({ username });
    if (!student) {
      console.error(
        `[${new Date().toISOString()}] User not found: ${username}`
      );
      return res.status(404).json({ message: "User not found" });
    }

    student.otp = generateOTP();
    student.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await student.save();

    await sendEmail(
      student.email,
      `Your OTP for password reset is: ${student.otp}`
    );
    console.debug(
      `[${new Date().toISOString()}] OTP sent to email: ${student.email}`
    );

    console.timeEnd("forgotPassword");
    res.status(200).json({
      message: "Password reset instructions sent to your email",
      studentId: student._id,
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error processing forgot password request:`,
      error
    );
    res.status(500).json({ message: "Server error" });
  }
};

// principalLogin - updated (robust)
const principalLogin = async (req, res) => {
  console.time("principalLogin");
  console.debug(
    `[${new Date().toISOString()}] Principal login request:`,
    req.body
  );

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "username and password required" });
  }

  try {
    // case-insensitive match for embedded principal username
    const school = await School.findOne({
      "principal.username": new RegExp(`^${username.trim()}$`, "i"),
    }).exec();

    if (!school) {
      console.error(
        `[${new Date().toISOString()}] Principal not found for username: ${username}`
      );
      return res.status(404).json({ message: "Principal not found" });
    }

    if (!school.principal) {
      console.error(
        `[${new Date().toISOString()}] Principal subdocument missing for school: ${
          school._id
        }`
      );
      return res
        .status(500)
        .json({ message: "Principal credentials not configured" });
    }

    // support both passwordHash or legacy password field
    const principalHash =
      school.principal.passwordHash || school.principal.password;
    if (!principalHash) {
      console.error(
        `[${new Date().toISOString()}] Principal credentials not set for school: ${
          school._id
        }`
      );
      return res
        .status(500)
        .json({ message: "Principal credentials not configured" });
    }

    // verify password (uses your existing comparePassword helper)
    const isMatch = await comparePassword(password, principalHash);
    if (!isMatch) {
      console.error(
        `[${new Date().toISOString()}] Invalid credentials (principal): ${username}`
      );
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // update lastLoginAt on the principal subdoc and save
    school.principal.lastLoginAt = new Date();
    await school.save();

    // principal subdoc has its own _id (from schema) - use it to generate token
    const principalId = school.principal._id;
    const token = generateToken(principalId);

    // build safe principal object (exclude passwordHash)
    const principalDoc =
      typeof school.principal.toObject === "function"
        ? school.principal.toObject()
        : { ...school.principal };
    delete principalDoc.passwordHash;
    delete principalDoc.password;

    const responsePayload = {
      message: "Login successful",
      role: "principal",
      token,
      principal_id: principalId,
      school_id: school._id,
      school: {
        _id: school._id,
        name: school.name,
        logo: school.school_image,
        school_certificate_images: school.school_certificate_images || [],
        mission_statement: school.mission_statement || "",
        contact_info: school.contact_info || {},
        staff: school.staff || [],
      },
      principal: principalDoc || {},
    };

    console.debug(
      `[${new Date().toISOString()}] Principal login success for username: ${username}`
    );

    console.timeEnd("principalLogin");
    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] principalLogin error:`, err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// STUDENT LOGOUT
// ============================================
const logout = async (req, res) => {
  console.log('\n========================================');
  console.log('🚪 STUDENT LOGOUT REQUEST');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User ID:', req.user?.id);
  
  try {
    console.log('✅ Logout successful');
    console.log('========================================\n');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('❌ LOGOUT ERROR:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

module.exports = {
  login,
  logout,
  verifyUser,
  changePassword,
  forgotPassword,
  staffLogin,
  principalLogin,
};
