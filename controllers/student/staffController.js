const Student = require('../../models/student');
const Staff = require('../../models/staff');
const Class = require('../../models/class');
const School = require('../../models/school');
const { logger } = require('../../utils/logger'); // Import logger

// Helper function to remove _id field from objects
const removeId = (obj) => {
    const { _id, ...rest } = obj;
    return rest;
};

// Controller to get all staff for a specific student
exports.getAllStaffByStudentId = async (req, res) => {
    try {
        const studentId = req.params.studentId;

        // Find the student by ID and populate the class_id field
        const student = await Student.findById(studentId).populate('class_id').lean().exec();
        if (!student) {
            logger.error(`Student not found for ID: ${studentId}`); // Log error
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find the class by class_id and populate the school_id field
        const classInfo = await Class.findById(student.class_id).populate('school_id').lean().exec();
        if (!classInfo) {
            logger.error(`Class not found for ID: ${student.class_id}`); // Log error
            return res.status(404).json({ message: 'Class not found' });
        }

        // Find the school by school_id and populate the staff array
        const schoolInfo = await School.findById(classInfo.school_id).populate('staff').lean().exec();
        if (!schoolInfo) {
            logger.error(`School not found for ID: ${classInfo.school_id}`); // Log error
            return res.status(404).json({ message: 'School not found' });
        }

        // Remove _id from each staff member
        const staffWithoutId = schoolInfo.staff.map(removeId);

        res.status(200).json(staffWithoutId);
    } catch (error) {
        logger.error('Error fetching staff by student ID:', error); // Log error
        res.status(500).json({ message: 'Server error', error });
    }
};

// Controller to get the class teacher for a specific student
exports.getClassTeacherByStudentId = async (req, res) => {
    try {
        const studentId = req.params.studentId;

        // Find the student by ID and populate the class_id field
        const student = await Student.findById(studentId).populate('class_id').lean().exec();
        if (!student) {
            logger.error(`Student not found for ID: ${studentId}`); // Log error
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find the class and populate the class_teacher field
        const classInfo = await Class.findById(student.class_id).populate('class_teacher').lean().exec();
        if (!classInfo) {
            logger.error(`Class not found for ID: ${student.class_id}`); // Log error
            return res.status(404).json({ message: 'Class not found' });
        }

        // Remove _id from class teacher
        const classTeacherWithoutId = removeId(classInfo.class_teacher);

        res.status(200).json(classTeacherWithoutId);
    } catch (error) {
        logger.error('Error fetching class teacher by student ID:', error); // Log error
        res.status(500).json({ message: 'Server error', error });
    }
};
