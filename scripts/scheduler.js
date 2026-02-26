const cron = require('node-cron');
const { archiveAttendance } = require('../utils/attendance');

// Schedule task to run at midnight every day
cron.schedule('0 0 * * *', () => {
    console.log('Running attendance archival process...');
    archiveAttendance().then(() => {
        console.log('Attendance archived successfully.');
    }).catch(err => {
        console.error('Error archiving attendance:', err);
    });
});
