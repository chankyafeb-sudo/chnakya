const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    createOrUpdateTimetable,
    getTimetablesByStudentId,
    getTimetableById,
    updateTimetable,
    deleteTimetable
} = require('../controllers/student/timetableController');
const apiLimiter = require('../middleware/rateLimiter');
router.use(apiLimiter);

// Apply authMiddleware to all routes
// router.use(authMiddleware);
router.use(authMiddleware);
// Routes
router.post('/class/:classId/:id', createOrUpdateTimetable); // POST request to create or update a timetable
router.get('/student/:id', getTimetablesByStudentId); // GET request to fetch all timetables for a student
router.get('/class-teacher/:classTeacherId/:id', getTimetableById); // GET request to fetch timetable by ID and class teacher ID
router.put('/class-teacher/:classTeacherId/:id', updateTimetable); // PUT request to update timetable by ID and class teacher ID
router.delete('/class-teacher/:classTeacherId/:id', deleteTimetable); // DELETE request to delete timetable by ID and class teacher ID

module.exports = router;
