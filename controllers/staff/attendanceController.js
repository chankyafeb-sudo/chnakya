const Attendance = require('../../models/attendance');
const Student = require('../../models/student');
const ClassModel = require('../../models/class');

// ============================================
// MARK ATTENDANCE
// ============================================
const markAttendance = async (req, res) => {
    console.log('\n========================================');
    console.log('✅ MARK ATTENDANCE REQUEST');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());

    try {
        const { student_id, class_id, school_id, date, status, notes } = req.body;

        if (!student_id || !class_id || !school_id || !date || !status) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'student_id, class_id, school_id, date, and status are required'
            });
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        console.log('📅 Marking attendance for:', student_id);
        console.log('Date:', attendanceDate);
        console.log('Status:', status);

        // Check if attendance already exists
        let attendance = await Attendance.findOne({
            student_id,
            class_id,
            date: attendanceDate
        });

        if (attendance) {
            attendance.status = status;
            attendance.notes = notes || '';
            await attendance.save();
            console.log('✅ Attendance updated');
        } else {
            attendance = await Attendance.create({
                student_id,
                class_id,
                school_id,
                date: attendanceDate,
                status,
                notes: notes || ''
            });
            console.log('✅ Attendance created');
        }

        console.log('========================================\n');

        return res.status(200).json({
            success: true,
            message: 'Attendance marked successfully',
            attendance
        });

    } catch (error) {
        console.error('❌ MARK ATTENDANCE ERROR:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// GET ATTENDANCE BY CLASS ID
// ============================================
const getAttendanceByClassId = async (req, res) => {
    console.log('\n========================================');
    console.log('📊 GET ATTENDANCE BY CLASS REQUEST');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());

    try {
        const { classid } = req.params;
        const { date, startDate, endDate } = req.query;

        console.log('Class ID:', classid);

        let query = { class_id: classid };

        if (date) {
            const attendanceDate = new Date(date);
            attendanceDate.setHours(0, 0, 0, 0);
            query.date = attendanceDate;
            console.log('Date filter:', attendanceDate);
        } else if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
            console.log('Date range:', start, 'to', end);
        }

        const attendance = await Attendance.find(query)
            .populate('student_id', 'name rollnumber photo')
            .select('-__v')
            .lean();

        console.log(`✅ Found ${attendance.length} attendance records`);
        console.log('========================================\n');

        return res.status(200).json({
            success: true,
            count: attendance.length,
            attendance
        });

    } catch (error) {
        console.error('❌ GET ATTENDANCE ERROR:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ============================================
// GET STUDENTS BY STAFF ID (Class Teacher ke students with FULL DETAILS)
// ============================================
const getStudentsByStaffId = async (req, res) => {
    console.log('\n========================================');
    console.log('👥 GET STUDENTS WITH ATTENDANCE REQUEST');
    console.log('========================================');

    try {
        // ✅ Handle both parameter names (staffid and teacherId)
        const staffId = req.params.staffid || req.params.teacherId;
        
        console.log('Staff ID:', staffId);
        console.log('All params:', JSON.stringify(req.params));

        if (!staffId) {
            console.log('❌ No staff ID found in parameters');
            return res.status(400).json({
                success: false,
                message: 'Staff ID is required'
            });
        }

        // Find class where this staff is class teacher
        const classDoc = await ClassModel.findOne({ class_teacher: staffId })
            .lean();

        if (!classDoc) {
            console.log('❌ No class found for this staff');
            return res.status(404).json({
                success: false,
                message: 'No class assigned to this staff'
            });
        }

        console.log(`✅ Found class: ${classDoc.class_name}`);
        console.log(`📚 Class ID: ${classDoc._id}`);

        // Get all students in this class
        const students = await Student.find({ class_id: classDoc._id })
            .select('name rollnumber photo gender mobile email dob address father_name mother_name')
            .lean();

        console.log(`✅ Found ${students.length} students`);

        // ✅ GET TODAY'S ATTENDANCE
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        console.log('📅 Today:', today.toISOString().split('T')[0]);

        // Get today's attendance for this class
        const attendanceRecords = await Attendance.find({
            class_id: classDoc._id,
            date: { $gte: today, $lte: todayEnd }
        })
        .select('student_id status notes')
        .lean();

        console.log(`✅ Found ${attendanceRecords.length} attendance records for today`);

        // Create a map of student_id -> attendance
        const attendanceMap = {};
        attendanceRecords.forEach(record => {
            attendanceMap[record.student_id.toString()] = {
                status: record.status,
                notes: record.notes || ''
            };
        });

        // ✅ MERGE: Students + Today Attendance
        const studentsWithAttendance = students.map(student => {
            const attendance = attendanceMap[student._id.toString()];
            
            return {
                _id: student._id,
                name: student.name,
                rollnumber: student.rollnumber,
                photo: student.photo,
                gender: student.gender,
                mobile: student.mobile,
                email: student.email,
                dob: student.dob,
                address: student.address,
                father_name: student.father_name,
                mother_name: student.mother_name,
                // ✅ TODAY ATTENDANCE
                attendance: {
                    status: attendance ? attendance.status : 'not_marked',
                    notes: attendance ? attendance.notes : '',
                    marked: !!attendance,
                    date: today.toISOString().split('T')[0]
                }
            };
        });

        console.log('📦 STUDENTS WITH ATTENDANCE DATA SENDING TO FRONTEND:');
        console.log(JSON.stringify(studentsWithAttendance, null, 2));
        console.log('========================================\n');

        return res.status(200).json({
            success: true,
            className: classDoc.class_name,
            classId: classDoc._id,
            date: today.toISOString().split('T')[0],
            count: studentsWithAttendance.length,
            markedCount: attendanceRecords.length,
            students: studentsWithAttendance
        });

    } catch (error) {
        console.error('❌ GET STUDENTS ERROR:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
// ============================================
// POST STUDENTS BY STAFF ID (legacy)
// ============================================
const postStudentsByStaffId = async (req, res) => {
    return markAttendance(req, res);
};

// ============================================
// SAVE TODAY'S ATTENDANCE (BULK)
// ============================================
const saveTodayAttendance = async (req, res) => {
    console.log('\n========================================');
    console.log('✅ SAVE TODAY ATTENDANCE REQUEST');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Body:', JSON.stringify(req.body, null, 2));

    try {
        // ✅ FIX: Accept array directly
        const attendanceData = req.body;

        // Validate that body is an array
        if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
            console.log('❌ Invalid data format - expected array of attendance records');
            return res.status(400).json({
                success: false,
                message: 'Expected array of attendance records'
            });
        }

        // Extract common values from first record
        const firstRecord = attendanceData[0];
        const classId = firstRecord.class_id;
        const date = firstRecord.date;

        if (!classId || !date) {
            console.log('❌ Missing class_id or date');
            return res.status(400).json({
                success: false,
                message: 'class_id and date required in records'
            });
        }

        console.log(`📅 Saving attendance for class ${classId} on ${date}`);
        console.log(`👥 Total students: ${attendanceData.length}`);

        // Validate class exists
        const classDoc = await ClassModel.findById(classId);
        if (!classDoc) {
            console.log('❌ Class not found:', classId);
            return res.status(404).json({ success: false, message: 'Class not found' });
        }

        console.log(`✅ Class found: ${classDoc.class_name} (${classDoc._id})`);

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Delete existing attendance for this date and class
        const deleted = await Attendance.deleteMany({
            class_id: classId,
            date: attendanceDate
        });

        console.log(`🗑️  Cleared ${deleted.deletedCount} old attendance records`);

        // ✅ Create new attendance records from the array
        const attendanceRecords = attendanceData.map(record => ({
            student_id: record.student_id,
            class_id: record.class_id,
            // ✅ Only add school_id if it exists and is not empty
            ...(record.school_id && record.school_id !== '' && { school_id: record.school_id }),
            date: attendanceDate,
            status: record.status?.toLowerCase() || 'absent', // Convert "Present" to "present"
            notes: record.notes || ''
        }));

        const saved = await Attendance.insertMany(attendanceRecords);

        console.log(`✅ Saved ${saved.length} attendance records`);
        console.log('========================================\n');

        return res.status(200).json({
            success: true,
            message: `Attendance saved for ${attendanceData.length} students`,
            saved: saved.length,
            className: classDoc.class_name,
            date: date
        });

    } catch (error) {
        console.error('❌ SAVE ATTENDANCE ERROR:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    markAttendance,
    getAttendanceByClassId,
    getStudentsByStaffId,
    postStudentsByStaffId,
    saveTodayAttendance
};