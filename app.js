const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const ConnectDB = require("./config/db");
require('dotenv').config();

console.log('\n🚀 Starting School Management System API');
console.log('==========================================');

// Import Auth Routes (Organized by Role)
const studentAuthRoutes = require('./routes/student/authRoutes');
const staffAuthRoutes = require('./routes/staff/authRoutes');
const principalAuthRoutes = require('./routes/principal/authRoutes');

// Import Other Routes
const principalRoutes = require('./routes/principalRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const bookRoutes = require('./routes/bookRoutes'); 
const eventRoutes = require('./routes/eventRoutes');
const feeRoutes = require('./routes/feeRoutes');
const schoolRoutes = require('./routes/schoolRoutes'); 
const attendanceRoutes = require('./routes/attendanceRoutes'); 
const classmateRoutes = require('./routes/classmateRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const studentRoutes = require('./routes/certificateRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const staffRoutes = require('./routes/staffRoutes');
const interactionRoutes = require('./routes/interctionRoutes');

console.log('✅ All route modules loaded\n');

// Create Express app
const app = express();

// Middleware
console.log('🔧 Setting up middleware...');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
console.log('✅ Middleware configured\n');

// Database connection
console.log('🗄️  Connecting to database...');
ConnectDB();

// ==========================================
// AUTHENTICATION ROUTES (Organized by Role)
// ==========================================
console.log('📍 Registering routes...');
app.use('/chankya/auth/student', studentAuthRoutes);  // Student login/logout
app.use('/chankya/auth/staff', staffAuthRoutes);      // Staff login/logout
app.use('/admin/auth', principalAuthRoutes);          // Principal login/logout

// ==========================================
// PRINCIPAL/ADMIN ROUTES
// ==========================================
app.use('/admin', principalRoutes);

// ==========================================
// STUDENT/STAFF SHARED ROUTES
// ==========================================
app.use('/chankya/timetable', timetableRoutes);
app.use('/chankya/assignment', assignmentRoutes);
app.use('/chankya/books', bookRoutes);
app.use('/chankya/events', eventRoutes);
app.use('/chankya/fee', feeRoutes);
app.use('/chankya/aboutschool', schoolRoutes);
app.use('/chankya/attendance', attendanceRoutes);
app.use('/chankya/classmate', classmateRoutes);
app.use('/chankya/notification', notificationRoutes);
app.use('/chankya/certificate', studentRoutes);
app.use('/chankya/feedback', feedbackRoutes);
app.use('/chankya/intraction', interactionRoutes);
app.use('/chankya/staff', staffRoutes);

console.log('✅ All routes registered\n');

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ ERROR:', err.message);
    console.error('Stack:', err.stack);
    res.status(err.status || 500).json({ error: err.message });
});

// 404 handler
app.use((req, res) => {
    console.log(`❌ 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('==========================================');
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 API Base: http://localhost:${PORT}`);
    console.log('==========================================\n');
    console.log('📋 Available Auth Endpoints:');
    console.log('   POST /chankya/auth/student/login');
    console.log('   POST /chankya/auth/staff/login');
    console.log('   POST /admin/auth/login');
    console.log('==========================================\n');
});
