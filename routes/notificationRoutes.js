const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/student/notificationController');
const apiLimiter = require('../middleware/rateLimiter');

router.use(apiLimiter);
router.use(authMiddleware);

// Get notifications (uses token userId)
router.get('/student', notificationController.getNotifications);

// Mark as read
router.put('/student/:notificationid/read', notificationController.markAsRead);

module.exports = router;
