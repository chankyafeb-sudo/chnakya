const mongoose = require('mongoose');
const Student = require('../../models/student'); // Adjust the path if needed

// Controller function to get fee details by student's ID
const getFeeByStudentId = async (req, res) => {
    try {
        const { studentid } = req.params;

        // Validate student ID format
        if (!mongoose.Types.ObjectId.isValid(studentid)) {
            return res.status(400).json({ error: 'Invalid student ID format' });
        }

        // Find the student
        const student = await Student.findById(studentid);

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Extract fee details from student document
        const feeDetails = student.fee;

        res.status(200).json(feeDetails);
    } catch (error) {
        console.error('Error retrieving fee details:', error);
        res.status(500).json({ error: 'Error retrieving fee details' });
    }
};

module.exports = { getFeeByStudentId };
