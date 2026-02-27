const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const upload = require("../utils/multerCloudinary");

const {
  getEventsByUserId,  // ✅ Universal controller
  getEventById,
} = require("../controllers/student/eventController");

const { 
  postEventBySchoolId,
} = require("../controllers/staff/eventController");

router.use(apiLimiter);
router.use(authMiddleware);

// ✅ SAME ROUTE - SAB USERS USE KARENGE (Student/Staff/Principal)
router.get("/student/:studentid", getEventsByUserId);

// ✅ Staff create event
router.post("/staff/:schoolid", upload.single("image"), postEventBySchoolId);

// ✅ Single event by ID
router.get("/:eventid", getEventById);

module.exports = router;