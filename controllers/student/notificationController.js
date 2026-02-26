const Student = require('../../models/student');
const Notification = require('../../models/notification');

exports.getNotifications = async (req, res) => {
    console.log('\n========================================');
    console.log('🔔 GET NOTIFICATIONS REQUEST');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // Use token userId
        const studentId = req.userId;
        console.log('Student ID from token:', studentId);

        if (!studentId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const student = await Student.findById(studentId).select('school_id name');
        
        if (!student) {
            console.log('❌ Student not found');
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        console.log(`✅ Student: ${student.name}`);
        console.log(`🏫 School ID: ${student.school_id}`);

        // Get notifications for the school
        const notifications = await Notification.find({ school_id: student.school_id })
            .select('title message type created_at created_by')
            .sort({ created_at: -1 })
            .lean();

        console.log(`✅ Found ${notifications.length} notifications`);
        console.log('📦 NOTIFICATIONS DATA SENDING TO FRONTEND:');
        console.log(JSON.stringify(notifications, null, 2));
        console.log('========================================\n');

        return res.status(200).json({
            success: true,
            count: notifications.length,
            notifications: notifications.map(n => ({
                id: n._id,
                title: n.title,
                message: n.message,
                type: n.type || 'Announcement',
                date: n.created_at,
                created_by: n.created_by
            }))
        });

    } catch (error) {
        console.error('❌ GET NOTIFICATIONS ERROR:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    console.log('\n🔔 MARK NOTIFICATION AS READ');
    console.log('Notification ID:', req.params.notificationid);
    
    try {
        // Just acknowledge - no actual read tracking in schema
        return res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('❌ MARK READ ERROR:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
