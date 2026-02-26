// middleware/authorizationMiddleware.js
const School = require('../models/school');
const { verifyToken } = require('../utils/auth');

console.log('📌 Loading Authorization Middleware');

// Base authorization function
const authorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    console.log('\n========================================');
    console.log('🔒 AUTHORIZATION CHECK');
    console.log('========================================');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Route:', req.method, req.originalUrl);
    
    try {
      const authHeader = req.headers['authorization'];
      
      if (!authHeader) {
        console.log('❌ No authorization header');
        return res.status(401).json({ success: false, message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      
      if (!token) {
        console.log('❌ Token missing from header');
        return res.status(401).json({ success: false, message: 'Invalid token format' });
      }

      console.log('🔑 Verifying token...');
      const decoded = verifyToken(token);
      
      if (!decoded || !decoded.id || !decoded.role) {
        console.log('❌ Invalid token structure');
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      console.log('✅ Token verified - User ID:', decoded.id);
      console.log('✅ User Role:', decoded.role);

      // Check if role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        console.log(`❌ Access denied - Required: ${allowedRoles.join('|')}, Got: ${decoded.role}`);
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Insufficient permissions.' 
        });
      }

      console.log('✅ Role authorized:', decoded.role);

      // Attach user to request
      req.user = { 
        id: decoded.id, 
        role: decoded.role,
        username: decoded.username,
        school_id: decoded.school_id
      };

      // For principal - verify school ownership
      if (decoded.role === 'principal') {
        const school_id = req.params.school_id || req.body.school_id;
        
        if (school_id) {
          console.log('🏫 Verifying principal school ownership...');
          console.log('Requested School ID:', school_id);
          console.log('Principal School ID:', decoded.school_id);
          
          // Check if principal belongs to this school
          const school = await School.findOne({ 
            _id: school_id,
            'principal.username': decoded.username 
          }).lean();
          
          if (!school) {
            console.log('❌ Principal does not own this school');
            return res.status(403).json({ 
              success: false, 
              message: 'Access denied. You can only access your own school data.' 
            });
          }
          
          console.log('✅ School ownership verified');
          req.schoolId = school_id;
        }
      }

      console.log('✅ Authorization successful');
      console.log('========================================\n');
      
      next();
    } catch (error) {
      console.error('❌ AUTHORIZATION ERROR:', error.message);
      console.error('Stack:', error.stack);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token', 
        error: error.message 
      });
    }
  };
};

// Role-specific middleware
const principalOnly = authorize(['principal']);
const staffOnly = authorize(['staff']);
const studentOnly = authorize(['student']);
const principalOrStaff = authorize(['principal', 'staff']);
const authenticated = authorize(['principal', 'staff', 'student']);

module.exports = { 
  authorize, 
  principalOnly, 
  staffOnly, 
  studentOnly, 
  principalOrStaff, 
  authenticated 
};
