const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const feedbackController = require('../controllers/student/feedbackController');
const apiLimiter = require('../middleware/rateLimiter');

router.use(apiLimiter);
router.use(authMiddleware);

// ✅ Route has parameter (but controller ignores it, uses token)
router.get('/student/:studentId', feedbackController.getFeedbackByStudentId);

// Submit feedback
router.post('/student/submit', feedbackController.submitFeedback);

module.exports = router;