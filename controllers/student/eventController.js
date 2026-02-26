const Event = require('../../models/event');
const Student = require('../../models/student');

// GET events - IGNORES URL parameter, uses TOKEN userId
const getEventsByStudentId = async (req, res) => {
    console.log('\n========================================');
    console.log('🎉 GET EVENTS REQUEST');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // ✅ IGNORE URL parameter, use TOKEN userId
        const studentId = req.userId; // From token (authMiddleware)
        console.log('Student ID from token:', studentId);
        console.log('URL parameter (ignored):', req.params.studentid);

        if (!studentId) {
            console.log('❌ No token userId');
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        // Get student to find school_id
        const student = await Student.findById(studentId).select('school_id name class_id').lean();
        
        if (!student) {
            console.log('❌ Student not found for ID:', studentId);
            return res.status(404).json({ 
                success: false, 
                error: 'Student not found'
            });
        }

        if (!student.school_id) {
            console.log('❌ Student has no school_id');
            return res.status(404).json({ 
                success: false, 
                error: 'Student not assigned to any school'
            });
        }

        console.log(`✅ Student: ${student.name}`);
        console.log(`🏫 School ID: ${student.school_id}`);
        console.log(`📚 Class ID: ${student.class_id}`);

        // Get all events for this school (Event model: school_id field)
        const events = await Event.find({ school_id: student.school_id })
            .select('-__v')
            .sort({ date: 1 })
            .lean();

        console.log(`✅ Found ${events.length} events for school ${student.school_id}`);
        console.log('📦 EVENTS DATA SENDING TO FRONTEND:');
        console.log(JSON.stringify(events, null, 2));
        console.log('========================================\n');

        return res.status(200).json({
            success: true,
            count: events.length,
            events: events
        });

    } catch (error) {
        console.error('❌ GET EVENTS ERROR:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

const getEventById = async (req, res) => {
    console.log('\n🎉 GET EVENT BY ID');
    console.log('Event ID:', req.params.eventid);
    
    try {
        const { eventid } = req.params;
        const event = await Event.findById(eventid).select('-__v').lean();

        if (!event) {
            console.log('❌ Event not found');
            return res.status(404).json({ success: false, error: 'Event not found' });
        }

        console.log('✅ Event found:', event.title);
        return res.status(200).json({
            success: true,
            event: event
        });
    } catch (error) {
        console.error('❌ GET EVENT BY ID ERROR:', error.message);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

module.exports = {
    getEventsByStudentId,
    getEventById
};