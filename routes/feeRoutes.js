// routes/feeRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");
const upload = require("../utils/multerCloudinary");
const { getFeeByStudentId } = require("../controllers/student/feeController");
const { putFeeByStudentId } = require("../controllers/staff/feeController");

router.use(apiLimiter);
router.use(authMiddleware);

// Get fee details by student ID
router.get("/student/:studentid", getFeeByStudentId);

// Update fee — single proof file allowed (field name: payment_proof_file)
router.put(
  "/staff/:studentid",
  upload.fields([
    { name: "payment_proof", maxCount: 1 }, // <- client sends 'payment_proof'
  ]),
  putFeeByStudentId
);

module.exports = router;
