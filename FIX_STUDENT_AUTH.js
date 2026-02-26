// Add this logout function to controllers/student/authController.js

const logout = async (req, res) => {
  console.log('\n========================================');
  console.log('🚪 STUDENT LOGOUT REQUEST');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User ID:', req.user?.id);
  
  try {
    console.log('✅ Logout successful');
    console.log('========================================\n');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('❌ LOGOUT ERROR:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Add 'logout' to module.exports
module.exports = {
  login,
  logout,  // <-- ADD THIS
  verifyUser,
  changePassword,
  forgotPassword,
  staffLogin,
  principalLogin,
};
