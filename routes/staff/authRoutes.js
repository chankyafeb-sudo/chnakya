// routes/staff/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/staff/authController');

console.log('📌 Loading Staff Auth Routes');

router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;
