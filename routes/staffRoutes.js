const express = require('express');
const router = express.Router();
const staffController = require('../controllers/student/staffController');
const { postAddNewStudentByClassId } = require('../controllers/staff/staffController');

const authMiddleware = require('../middleware/authMiddleware');
const apiLimiter = require('../middleware/rateLimiter');
const upload = require('../utils/multerCloudinary'); // memoryStorage multer

router.use(apiLimiter);
router.use(authMiddleware);

// existing routes...
router.get('/student/:studentId', staffController.getAllStaffByStudentId);
router.get('/student/:studentId/classteacher', staffController.getClassTeacherByStudentId);

// IMPORTANT: use upload.single('photo') so req.file is available in controller.
// Client can POST either:
//  - multipart/form-data with a file field named 'photo' (preferred), and other fields as form fields
//  - or application/json with a "photo" string (public_id OR full URL)
router.post('/staff/:staffid', upload.single('photo'), postAddNewStudentByClassId);

module.exports = router;
