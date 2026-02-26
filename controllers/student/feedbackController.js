const Feedback = require('../../models/feedback');
const Student = require('../../models/student');

// Helper function to format date
const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

// Get feedback - IGNORES URL parameter, uses TOKEN userId
exports.getFeedbackByStudentId = async (req, res) => {
    console.log('\n========================================');
    console.log('💬 GET FEEDBACK REQUEST');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // ✅ IGNORE URL parameter, use TOKEN userId
        const studentId = req.userId; // From token (authMiddleware)
        console.log('Student ID from token:', studentId);
        console.log('URL parameter (ignored):', req.params.studentId || req.params.studentid);

        if (!studentId) {
            console.log('❌ No token userId');
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Verify student exists
        const student = await Student.findById(studentId).select('name').lean();
        
        if (!student) {
            console.log('❌ Student not found for ID:', studentId);
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        console.log(`✅ Student: ${student.name}`);

        // Find feedback where student field = studentId (Feedback model: student: ObjectId)
        const feedbacks = await Feedback.find({ student: studentId })
            .populate('staff', 'name subject photo')
            .lean()
            .exec();

        if (!feedbacks || feedbacks.length === 0) {
            console.log('ℹ️  No feedback found - returning empty array');
            console.log('📦 FEEDBACK DATA SENDING TO FRONTEND: []');
            console.log('========================================\n');
            return res.status(200).json({ 
                success: true,
                count: 0,
                message: 'No feedback found',
                feedbacks: []
            });
        }

        // Format feedbacks
        const formattedFeedbacks = feedbacks.map(feedback => {
            const { _id, staff, createdAt, ...rest } = feedback;
            const { _id: staffId, ...staffData } = staff || {};

            return {
                id: _id,
                ...rest,
                staff: staffData,
                date: createdAt ? formatDate(createdAt) : null
            };
        });

        console.log(`✅ Found ${formattedFeedbacks.length} feedback records`);
        console.log('📦 FEEDBACK DATA SENDING TO FRONTEND:');
        console.log(JSON.stringify(formattedFeedbacks, null, 2));
        console.log('========================================\n');

        return res.status(200).json({
            success: true,
            count: formattedFeedbacks.length,
            feedbacks: formattedFeedbacks
        });

    } catch (error) {
        console.error('❌ GET FEEDBACK ERROR:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Submit feedback
exports.submitFeedback = async (req, res) => {
    console.log('\n========================================');
    console.log('📝 SUBMIT FEEDBACK REQUEST');
    console.log('========================================');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { title, description, rating, staff_id } = req.body;
        const studentId = req.userId;

        if (!studentId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        if (!title || !description || !rating || !staff_id) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ 
                success: false, 
                message: 'title, description, rating, and staff_id are required' 
            });
        }

        // Get student for verification
        const student = await Student.findById(studentId).select('name').lean();
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        console.log(`✅ Student: ${student.name}`);

        // Create feedback (Feedback model: student field)
        const feedback = await Feedback.create({
            student: studentId,
            staff: staff_id,
            title,
            description,
            rating,
            createdAt: new Date()
        });

        console.log('✅ Feedback submitted successfully');
        console.log('Feedback ID:', feedback._id);
        console.log('========================================\n');

        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: {
                id: feedback._id,
                title: feedback.title,
                rating: feedback.rating
            }
        });

    } catch (error) {
        console.error('❌ SUBMIT FEEDBACK ERROR:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};