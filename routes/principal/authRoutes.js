// routes/principal/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/principal/authController');

console.log('📌 Loading Principal Auth Routes');

router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;
