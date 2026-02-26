const Student = require('../../models/student');
const { logger } = require('../../utils/logger');

exports.getCertificates = async (req, res) => {
    console.log('\n========================================');
    console.log('🏆 GET CERTIFICATES REQUEST');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Student ID:', req.params.studentId);

    try {
        const { studentId } = req.params;

        console.log('🔍 Finding student...');
        const student = await Student.findById(studentId).select('certificates name');

        if (!student) {
            console.log('❌ Student not found');
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        console.log(`✅ Student found: ${student.name}`);
        console.log(`📜 Total certificates: ${student.certificates?.length || 0}`);

        // Return empty array if no certificates (NOT 404)
        if (!student.certificates || student.certificates.length === 0) {
            console.log('ℹ️  No certificates - returning empty array');
            console.log('📦 CERTIFICATES DATA SENDING TO FRONTEND: []');
            console.log('========================================\n');
            return res.status(200).json({
                success: true,
                message: 'No certificates found',
                count: 0,
                certificates: []
            });
        }

        const formattedCertificates = student.certificates.map(cert => ({
            certificate_image: cert.certificate_image,
            issue_date: cert.issue_date ? cert.issue_date.toISOString().split('T')[0] : null,
            title: cert.title,
            awarded_by: cert.awarded_by
        }));

        console.log('📦 CERTIFICATES DATA SENDING TO FRONTEND:');
        console.log(JSON.stringify(formattedCertificates, null, 2));
        console.log('========================================\n');

        return res.status(200).json({
            success: true,
            count: formattedCertificates.length,
            certificates: formattedCertificates
        });

    } catch (error) {
        console.error('❌ GET CERTIFICATES ERROR:', error.message);
        logger.error('Error fetching certificates:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
