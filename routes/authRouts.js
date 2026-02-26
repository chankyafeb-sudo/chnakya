// routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter"); // Import rate limiter

const {
  login,
  staffLogin,
  principalLogin,
  verifyUser,
  changePassword,
  forgotPassword,
} = require("../controllers/student/authController");

// Apply rate limiter to all routes
router.use(apiLimiter);

router.post("/login", login);
router.post("/staff-login", staffLogin);
router.post("/principal-login", principalLogin); // new principal login endpoint
router.post("/verify-otp", verifyUser);
router.post("/change-password", authMiddleware, changePassword); // Authentication required
router.post("/forgot-password", forgotPassword);

module.exports = router;
