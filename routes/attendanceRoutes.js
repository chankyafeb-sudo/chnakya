const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getAttendanceByStudentId } = require("../controllers/student/attendanceController");
const {
  getStudentsByStaffId,
  postStudentsByStaffId,
  saveTodayAttendance,
  getAttendanceByClassId
} = require("../controllers/staff/attendanceController");
const apiLimiter = require("../middleware/rateLimiter");

router.use(apiLimiter);
router.use(authMiddleware);

// Student routes
router.get("/student/:studentid", getAttendanceByStudentId);

// Staff routes - Get students list
router.get("/staff/:staffid/class-students", getStudentsByStaffId);

// Staff routes - Mark attendance (legacy)
router.post("/staff/:staffid/class-students", postStudentsByStaffId);

// Staff routes - Get class attendance
router.get("/staff/class/:classid", getAttendanceByClassId);

// ✅ TODAY ATTENDANCE - Both GET and POST
router.get("/class/:teacherId/today", getStudentsByStaffId); // Returns students list
router.post("/staff/:teacherId/submit", saveTodayAttendance); // Saves attendance

module.exports = router;