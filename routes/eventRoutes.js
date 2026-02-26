// routes/eventRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const upload = require("../utils/multerCloudinary");

const {
  getEventsByStudentId,
  getEventById,
} = require("../controllers/student/eventController");

const { 
  postEventBySchoolId,
  getEventsBySchoolId  // ✅ NEW: Get events by school ID
} = require("../controllers/staff/eventController");

router.use(apiLimiter);
router.use(authMiddleware);

// ✅ Student routes
router.get("/student/:studentid", getEventsByStudentId);

// ✅ Staff routes
router.post("/staff/:schoolid", upload.single("image"), postEventBySchoolId);
router.get("/school/:schoolid", getEventsBySchoolId); // ✅ NEW ROUTE

// ✅ Single event by ID
router.get("/:eventid", getEventById);

module.exports = router;