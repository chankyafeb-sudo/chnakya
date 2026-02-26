const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/student/intrectionController');
const authMiddleware = require('../middleware/authMiddleware');
const apiLimiter = require('../middleware/rateLimiter');
router.use(apiLimiter);
router.use(authMiddleware);
// Route to get interactions for a specific student
router.get('/student/:studentId', interactionController.getInteractionsByStudentId);

module.exports = router;
