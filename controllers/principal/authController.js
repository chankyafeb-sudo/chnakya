// controllers/principal/authController.js
const School = require('../../models/school');
const { comparePassword } = require('../../utils/password');
const { generateToken } = require('../../utils/auth');

// PRINCIPAL LOGIN
const login = async (req, res) => {
  console.log('\n========================================');
  console.log('👨‍💼 PRINCIPAL LOGIN REQUEST');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Body:', { username: req.body.username, password: '***' });
  
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Validation Failed: Missing credentials');
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    console.log(`🔍 Searching principal: ${username}`);
    const school = await School.findOne({ 'principal.username': username });
    
    if (!school) {
      console.log(`❌ Principal not found: ${username}`);
      return res.status(404).json({ success: false, message: 'Principal not found' });
    }

    console.log(`✅ Principal found: ${school.principal.name}`);
    console.log(`🏫 School: ${school.name} (ID: ${school._id})`);

    console.log('🔑 Verifying password...');
    const isMatch = await comparePassword(password, school.principal.passwordHash);
    
    if (!isMatch) {
      console.log(`❌ Invalid password for: ${username}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('✅ Password verified');

    console.log('🎫 Generating token...');
    const token = generateToken({
      id: school.principal._id || school._id,
      role: 'principal',
      username: school.principal.username,
      school_id: school._id
    });

    console.log('✅ Token generated');
    console.log(`📤 Login successful for: ${school.principal.name}`);
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      school_id: school._id,
      principalData: {
        name: school.principal.name,
        username: school.principal.username,
        email: school.principal.email,
        phone: school.principal.phone,
        school_id: school._id,
        school_name: school.name,
        school_image: school.school_image
      }
    });

  } catch (error) {
    console.error('❌ PRINCIPAL LOGIN ERROR:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// PRINCIPAL LOGOUT
const logout = async (req, res) => {
  console.log('\n========================================');
  console.log('🚪 PRINCIPAL LOGOUT REQUEST');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Principal ID:', req.user?.id);
  
  try {
    console.log('✅ Logout successful');
    console.log('========================================\n');
    
    return res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('❌ LOGOUT ERROR:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { login, logout };
