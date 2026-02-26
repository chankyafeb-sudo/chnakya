const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const studentController = require('../controllers/student/certificateController');
const {putCertificateByStudentId}=require('../controllers/staff/certificateController')
const apiLimiter = require('../middleware/rateLimiter');
router.use(apiLimiter);
router.use(authMiddleware);
// Route to get certificates by student ID
router.get('/student/:studentId', studentController.getCertificates);

router.put('/staff/:studentid',putCertificateByStudentId)

module.exports = router;
