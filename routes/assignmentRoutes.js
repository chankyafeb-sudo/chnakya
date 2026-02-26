// routes/assignmentRoutes.js (partial)
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const upload = require("../utils/multerCloudinary"); // memory upload for cloudinary

const {
  getAssignmentsByStudentIdAndStatus,
} = require("../controllers/student/assignmentController");

const {
  getClassListByStaffId,
  postAssignmentByClassId,
  getAssignmentsByClassId,
  getAssignmentsByAssignmentId,
  updateSubmissionByAssignmentId,
} = require("../controllers/staff/assignmentController");

router.use(apiLimiter);
router.use(authMiddleware);

// student
router.get("/student/:studentid/", getAssignmentsByStudentIdAndStatus);

// staff
router.get("/staff/:staffid", getClassListByStaffId);
router.get("/staff/class/:classid", getAssignmentsByClassId);
router.get("/staff/class/:assignmentid", getAssignmentsByAssignmentId);

// UPDATE submission for an assignment (student submission) -> supports files
router.put(
  "/staff/class/:assignmentid",
  upload.fields([
    { name: "submission_files", maxCount: 5 }, // student files
    // optionally accept a single 'submission_file' instead
  ]),
  updateSubmissionByAssignmentId
);

// CREATE assignment for class -> supports resources (pdf/images) + optional cover
router.post(
  "/staff/:classid",
  upload.fields([
    { name: "resources", maxCount: 10 }, // assignment resources (pdfs/images)
    { name: "cover_image", maxCount: 1 }, // optional cover
  ]),
  postAssignmentByClassId
);

module.exports = router;
