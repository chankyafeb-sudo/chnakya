// routes/principalRoutes.js
const express = require('express');
const router = express.Router();
const principalController = require('../controllers/principal/principalController');
const { principalOnly } = require('../middleware/authorizationMiddleware');

console.log('📌 Loading Principal Routes');

// ============================================
// DASHBOARD & OVERVIEW
// ============================================
router.get('/dashboard/overview/:school_id',
  principalOnly,
  (req, res, next) => {
    console.log('📊 Dashboard Overview - School:', req.params.school_id);
    next();
  },
  principalController.getDashboardOverview
);

// ============================================
// CLASS REPORTS
// ============================================
router.get('/reports/classes/:school_id',
  principalOnly,
  (req, res, next) => {
    console.log('📚 Get Class List - School:', req.params.school_id);
    next();
  },
  principalController.getClassList
);

router.get('/reports/class/:school_id/:class_name',
  principalOnly,
  (req, res, next) => {
    console.log('📊 Get Class Data - Class:', req.params.class_name);
    next();
  },
  principalController.getClassData
);

// ============================================
// ATTENDANCE REPORTS
// ============================================
router.get('/reports/attendance/:school_id',
  principalOnly,
  (req, res, next) => {
    console.log('📅 Attendance Reports - Filters:', req.query);
    next();
  },
  principalController.getAttendanceReports
);

// ============================================
// FINANCIAL REPORTS
// ============================================
router.get('/reports/financial/:school_id',
  principalOnly,
  (req, res, next) => {
    console.log('💰 Financial Reports - Filters:', req.query);
    next();
  },
  principalController.getFinancialReports
);

// ============================================
// STUDENT MANAGEMENT
// ============================================
router.get('/students/all/:school_id',
  principalOnly,
  (req, res, next) => {
    console.log('👨‍🎓 Get All Students - Filters:', req.query);
    next();
  },
  principalController.getAllStudents
);

// ============================================
// FEE MANAGEMENT
// ============================================
router.get('/fees/student/:student_id',
  principalOnly,
  (req, res, next) => {
    console.log('💵 Get Student Fees - Student:', req.params.student_id);
    next();
  },
  principalController.getStudentFees
);

router.get('/fees/overview/:school_id',
  principalOnly,
  (req, res, next) => {
    console.log('💰 Fees Overview - School:', req.params.school_id);
    next();
  },
  principalController.getFeesOverview
);

console.log('✅ Principal routes loaded - 8 endpoints registered');

module.exports = router;
