const Event = require('../../models/event');
const Student = require('../../models/student');
const Staff = require('../../models/staff');
const School = require('../../models/school');  // ✅ For Principal check

// ✅ UNIVERSAL GET EVENTS - Works for Student, Staff & Principal
const getEventsByUserId = async (req, res) => {
    console.log('\n========================================');
    console.log('🎉 GET EVENTS REQUEST (UNIVERSAL)');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // ✅ Get userId from token (ignores URL parameter)
        const userId = req.userId; // From token (authMiddleware)
        console.log('User ID from token:', userId);
        console.log('URL parameter (ignored):', req.params.studentid);

        if (!userId) {
            console.log('❌ No token userId');
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        let schoolId = null;
        let userName = null;
        let userType = null;

        // ✅ TRY 1: Check if Student
        console.log('🔍 Checking if user is Student...');
        const student = await Student.findById(userId).select('school_id name').lean();
        if (student && student.school_id) {
            schoolId = student.school_id;
            userName = student.name;
            userType = 'Student';
            console.log(`✅ User is Student: ${userName}`);
        }

        // ✅ TRY 2: Check if Staff (if not student)
        if (!schoolId) {
            console.log('🔍 Checking if user is Staff...');
            const staff = await Staff.findById(userId).select('school_id name').lean();
            if (staff && staff.school_id) {
                schoolId = staff.school_id;
                userName = staff.name;
                userType = 'Staff';
                console.log(`✅ User is Staff: ${userName}`);
            }
        }

        // ✅ TRY 3: Check if Principal (subdocument in School)
        if (!schoolId) {
            console.log('🔍 Checking if user is Principal...');
            const school = await School.findOne({ 'principal._id': userId })
                .select('_id principal.name')
                .lean();
            
            if (school && school.principal) {
                schoolId = school._id;
                userName = school.principal.name;
                userType = 'Principal';
                console.log(`✅ User is Principal: ${userName}`);
            }
        }

        // ❌ User not found in any model
        if (!schoolId) {
            console.log('❌ User not found in Student/Staff/Principal');
            return res.status(404).json({ 
                success: false, 
                error: 'User not found or not assigned to any school'
            });
        }

        console.log(`👤 User Type: ${userType}`);
        console.log(`👤 User Name: ${userName}`);
        console.log(`🏫 School ID: ${schoolId}`);

        // ✅ Get all events for this school
        const events = await Event.find({ school_id: schoolId })
            .select('-__v')
            .sort({ date: 1 })
            .lean();

        console.log(`✅ Found ${events.length} events for school ${schoolId}`);
        console.log('📦 EVENTS DATA SENDING TO FRONTEND:');
        console.log(JSON.stringify(events, null, 2));
        console.log('========================================\n');

        return res.status(200).json({
            success: true,
            userType: userType,
            count: events.length,
            events: events
        });

    } catch (error) {
        console.error('❌ GET EVENTS ERROR:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// ✅ GET EVENT BY ID
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
    getEventsByUserId,
    getEventById
};