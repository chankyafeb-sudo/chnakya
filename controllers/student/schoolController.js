const mongoose = require('mongoose');
const Student = require('../../models/student');
const Staff = require('../../models/staff');
const Class = require('../../models/class');
const School = require('../../models/school');

const getSchoolByStudentId = async (req, res) => {
    console.log('\n========================================');
    console.log('🏫 GET SCHOOL DETAILS REQUEST');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());

    try {
        // Get ID - from URL param or from token
        const paramId = req.params.studentid;
        const tokenId = req.userId;
        const role = req.userRole;
        const userId = tokenId || paramId; // Token ID has priority!

        console.log('User ID:', userId);
        console.log('Role from token:', role || 'student/unknown');

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        let school = null;

        // ==============================
        // TRY 1: Staff model - school_id field
        // ==============================
        if (!school) {
            console.log('🔍 Trying Staff.findById...');
            const staff = await Staff.findById(userId).select('school_id name');
            if (staff) {
                console.log(`✅ Found as Staff: ${staff.name}`);
                if (staff.school_id) {
                    school = await School.findById(staff.school_id).lean();
                    console.log('✅ School found via staff.school_id');
                }
            }
        }

        // ==============================
        // TRY 2: School model - staff array
        // ==============================
        if (!school) {
            console.log('🔍 Trying School.findOne({ staff: userId })...');
            school = await School.findOne({ staff: userId }).lean();
            if (school) console.log('✅ School found via school.staff array');
        }

        // ==============================
        // TRY 3: Student model - school_id field
        // ==============================
        if (!school) {
            console.log('🔍 Trying Student.findById...');
            const student = await Student.findById(userId).select('school_id class_id name');
            if (student) {
                console.log(`✅ Found as Student: ${student.name}`);
                if (student.school_id) {
                    school = await School.findById(student.school_id).lean();
                    console.log('✅ School found via student.school_id');
                } else if (student.class_id) {
                    const cls = await Class.findById(student.class_id).select('school_id');
                    if (cls) {
                        school = await School.findById(cls.school_id).lean();
                        console.log('✅ School found via student→class→school');
                    }
                }
            }
        }

        if (!school) {
            console.log('❌ School not found for ID:', userId);
            return res.status(404).json({ error: 'School not found' });
        }

        console.log(`✅ School: ${school.name}`);

        // Remove sensitive fields
        const { _id, __v, principal, ...schoolDetails } = school;

        console.log('📦 SCHOOL DATA SENDING TO FRONTEND:');
        console.log(JSON.stringify(schoolDetails, null, 2));
        console.log('========================================\n');

        return res.status(200).json({
            success: true,
            school: schoolDetails
        });

    } catch (error) {
        console.error('❌ GET SCHOOL ERROR:', error.message);
        return res.status(500).json({ error: 'Error retrieving school details' });
    }
};

module.exports = { getSchoolByStudentId };
