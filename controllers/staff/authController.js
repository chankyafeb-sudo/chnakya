// controllers/staff/authController.js
const Staff = require('../../models/staff');
const { comparePassword, hashedPassword } = require('../../utils/password');
const { generateToken } = require('../../utils/auth');

// STAFF LOGIN
const login = async (req, res) => {
  console.log('\n========================================');
  console.log('🔐 STAFF LOGIN REQUEST');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Body:', { username: req.body.username, password: '***' });
  
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Validation Failed: Missing credentials');
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    console.log(`🔍 Searching staff: ${username}`);
    const staff = await Staff.findOne({ username });
    
    if (!staff) {
      console.log(`❌ Staff not found: ${username}`);
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    console.log(`✅ Staff found: ${staff.name} (ID: ${staff._id})`);

    console.log('🔑 Verifying password...');
    const isMatch = await comparePassword(password, staff.password);
    
    if (!isMatch) {
      console.log(`❌ Invalid password for: ${username}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('✅ Password verified');

    // ✅ FIND CLASS WHERE THIS STAFF IS CLASS TEACHER
    console.log('🏫 Finding assigned class...');
    const ClassModel = require('../../models/class');
    const assignedClass = await ClassModel.findOne({ class_teacher: staff._id }).lean();
    
    let classInfo = null;
    if (assignedClass) {
      classInfo = {
        class_id: assignedClass._id,
        class_name: assignedClass.class_name
      };
      console.log(`✅ Class teacher of: ${assignedClass.class_name} (ID: ${assignedClass._id})`);
    } else {
      console.log('⚠️  No class assigned as class teacher');
    }

    console.log('🎫 Generating token...');
    const token = generateToken(staff._id);

    console.log('✅ Token generated');
    console.log(`📤 Login successful for: ${staff.name}`);
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      staff_id: staff._id,
      staffData: {
        _id: staff._id,
        name: staff.name,
        username: staff.username,
        email: staff.email,
        mobile: staff.mobile,
        subject: staff.subject,
        photo: staff.photo,
        school_id: staff.school_id?._id,
        school_name: staff.school_id?.name,
        // ✅ CLASS INFO ADDED
        class_id: classInfo?.class_id || null,
        class_name: classInfo?.class_name || null
      }
    });

  } catch (error) {
    console.error('❌ STAFF LOGIN ERROR:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
// STAFF LOGOUT
const logout = async (req, res) => {
  console.log('\n========================================');
  console.log('🚪 STAFF LOGOUT REQUEST');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Staff ID:', req.user?.id);
  
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
