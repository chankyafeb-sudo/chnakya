const Student = require('../../models/student');
const Class = require('../../models/class');
const { logger } = require('../../utils/logger');

const getClassmates = async (req, res) => {
    console.log('\n========================================');
    console.log('👥 GET CLASSMATES REQUEST');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Student ID:', req.params.studentId);

    try {
        const { studentId } = req.params;

        console.log('🔍 Finding student...');
        const student = await Student.findById(studentId).select('class_id name');
        if (!student) {
            console.log('❌ Student not found');
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        console.log(`✅ Student found: ${student.name}`);

        const studentClass = await Class.findById(student.class_id).select('class_name');
        if (!studentClass) {
            console.log('❌ Class not found');
            return res.status(404).json({ success: false, message: 'Class not found' });
        }

        console.log(`✅ Class: ${studentClass.class_name}`);

        const classmates = await Student.find({ class_id: student.class_id })
            .select('name rollnumber photo gender')
            .lean();

        const classmatesData = classmates.map(classmate => {
            const { _id, ...rest } = classmate;
            return { ...rest, class_name: studentClass.class_name };
        });

        console.log(`✅ Found ${classmatesData.length} classmates`);
        console.log('📦 CLASSMATES DATA SENDING TO FRONTEND:');
        console.log(JSON.stringify(classmatesData, null, 2));
        console.log('========================================\n');

        return res.status(200).json({
            success: true,
            count: classmatesData.length,
            classmates: classmatesData
        });

    } catch (error) {
        console.error('❌ GET CLASSMATES ERROR:', error.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getClassmates };
