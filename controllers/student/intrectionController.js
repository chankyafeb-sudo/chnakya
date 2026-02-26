const Interaction = require('../../models/intrection'); // Fixed typo from 'intrection' to 'interaction'
const Student = require('../../models/student');
const Staff = require('../../models/staff'); // Assuming you have a Staff model
const { logger } = require('../../utils/logger'); // Import logger

// Helper function to remove _id and __v fields from interaction objects
const formatInteraction = (interaction) => ({
    name: interaction.class_teacher.name,
    photo: interaction.class_teacher.photo,
    subject: interaction.class_teacher.subject,
    date: interaction.date,
    time: interaction.time,
    reason: interaction.reason,
});

// Controller to get all interactions for a student
exports.getInteractionsByStudentId = async (req, res) => {
    try {
        const studentId = req.params.studentId;

        logger.debug('Received student ID:', studentId); // Debug output

        // Find the student and ensure they are in a class
        const student = await Student.findById(studentId).populate('class_id');
        if (!student) {
            logger.info('Student not found for ID:', studentId);
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get the class ID of the student
        const classId = student.class_id._id;

        // Find interactions related to the class
        const interactions = await Interaction.find({ class_id: classId })
            .populate({
                path: 'class_teacher',
                select: 'name photo subject', // Populate additional fields
            })
            .exec();

        logger.debug('Found interactions:', interactions); // Debug output

        // Format interactions to exclude _id and __v
        const formattedInteractions = interactions.map(formatInteraction);

        if (formattedInteractions.length === 0) {
            logger.info('No interactions found for class ID:', classId);
            return res.status(404).json({ message: 'No interactions found for this class' });
        }

        logger.debug('Formatted interactions:', formattedInteractions); // Debug output

        res.status(200).json(formattedInteractions);
    } catch (error) {
        logger.error('Error fetching interactions:', error); // Log the error
        res.status(500).json({ message: 'Server error', error });
    }
};
