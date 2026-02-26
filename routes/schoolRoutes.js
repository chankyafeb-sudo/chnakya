const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getSchoolByStudentId } = require('../controllers/student/schoolController'); // Adjust the path if needed
const apiLimiter = require('../middleware/rateLimiter');
router.use(apiLimiter);
router.use(authMiddleware);
// Route to get school details by student's ID
router.get('/student/:studentid', getSchoolByStudentId);

module.exports = router;
