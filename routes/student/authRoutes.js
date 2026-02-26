// routes/student/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/student/authController');

console.log('📌 Loading Student Auth Routes');

router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;
