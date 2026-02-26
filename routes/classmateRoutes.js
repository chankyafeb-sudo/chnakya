const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getClassmates } = require('../controllers/student/classmateController');
const apiLimiter = require('../middleware/rateLimiter');
router.use(apiLimiter);
router.use(authMiddleware);
// Route to get all classmates of a student
router.get('/student/:studentId', getClassmates);

module.exports = router;
