// controllers/principal/principalController.js
const mongoose = require('mongoose');
const School = require('../../models/school');
const Student = require('../../models/student');
const Staff = require('../../models/staff');
const ClassModel = require('../../models/class');
const Attendance = require('../../models/attendance');
const Assignment = require('../../models/assignment');
const Event = require('../../models/event');
const Notification = require('../../models/notification');

// ============================================
// DASHBOARD OVERVIEW
// ============================================
const getDashboardOverview = async (req, res) => {
  console.log('\n========================================');
  console.log('📊 DASHBOARD OVERVIEW REQUEST');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  console.log('School ID:', req.params.school_id);
  console.log('Principal ID:', req.user?.id);
  
  try {
    const { school_id } = req.params;

    console.log('🔍 Fetching school data...');
    const school = await School.findById(school_id);
    
    if (!school) {
      console.log('❌ School not found');
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    console.log('✅ School found:', school.name);

    // Get total counts
    console.log('📊 Calculating statistics...');
    const totalStudents = await Student.countDocuments({ school_id });
    const totalTeachers = await Staff.countDocuments({ school_id });
    const totalClasses = await ClassModel.countDocuments({ school_id });

    console.log(`Students: ${totalStudents}, Teachers: ${totalTeachers}, Classes: ${totalClasses}`);

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Get today's attendance
    console.log('📅 Fetching today\'s attendance...');
    const todayAttendance = await Attendance.find({
      class_id: { $exists: true },
      date: { $gte: today, $lte: todayEnd }
    });

    const activeStudents = todayAttendance.filter(a => a.status === 'present').length;
    const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
    const todayAttendancePercentage = totalStudents > 0 
      ? ((activeStudents / totalStudents) * 100).toFixed(1) 
      : 0;

    console.log(`Today: ${activeStudents} present, ${absentToday} absent (${todayAttendancePercentage}%)`);

    // Get overall attendance
    const allStudents = await Student.find({ school_id }).select('_id');
    const studentAttendance = await Promise.all(
      allStudents.map(async (student) => {
        const records = await Attendance.find({ student_id: student._id });
        if (records.length === 0) return 0;
        const present = records.filter(r => r.status === 'present').length;
        return (present / records.length) * 100;
      })
    );

    const overallAttendance = studentAttendance.length > 0
      ? (studentAttendance.reduce((a, b) => a + b, 0) / studentAttendance.length).toFixed(1)
      : 0;

    console.log(`Overall attendance: ${overallAttendance}%`);

    // Get fee statistics
    console.log('💰 Calculating fee statistics...');
    const students = await Student.find({ school_id }).select('fee');
    
    let totalFeesAmount = 0;
    let totalFeesCollected = 0;
    let totalFeesPending = 0;
    let defaulters = 0;

    students.forEach(student => {
      if (student.fee) {
        totalFeesAmount += student.fee.total_amount || 0;
        totalFeesCollected += student.fee.paid_amount || 0;
        totalFeesPending += student.fee.pending_amount || 0;
        if (student.fee.pending_amount > 0) defaulters++;
      }
    });

    const feesCollectionPercentage = totalFeesAmount > 0
      ? ((totalFeesCollected / totalFeesAmount) * 100).toFixed(1)
      : 0;

    console.log(`Fees: ${totalFeesCollected}/${totalFeesAmount} (${feesCollectionPercentage}%)`);

    // Get assignments
    console.log('📝 Fetching assignments...');
    const allAssignments = await Assignment.find({ school_id });
    const pendingAssignments = allAssignments.filter(a => !a.submissions || a.submissions.length === 0).length;
    const completedAssignments = allAssignments.length - pendingAssignments;

    // Get events and notifications
    const upcomingEvents = await Event.countDocuments({
      school_id,
      date: { $gte: new Date() }
    });

    const recentNotifications = await Notification.countDocuments({
      school_id,
      created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Get top performing class (by attendance)
    const classes = await ClassModel.find({ school_id });
    let topPerformingClass = 'N/A';
    let lowestAttendanceClass = 'N/A';
    let highestAttendance = 0;
    let lowestAttendance = 100;

    for (const classDoc of classes) {
      const classStudents = await Student.countDocuments({ class_id: classDoc._id });
      if (classStudents === 0) continue;

      const classAttendanceRecords = await Attendance.find({
        class_id: classDoc._id,
        date: { $gte: today, $lte: todayEnd }
      });

      const presentCount = classAttendanceRecords.filter(r => r.status === 'present').length;
      const attendancePercent = classStudents > 0
        ? (presentCount / classStudents) * 100
        : 0;

      if (attendancePercent > highestAttendance) {
        highestAttendance = attendancePercent;
        topPerformingClass = classDoc.class_name;
      }

      if (attendancePercent < lowestAttendance) {
        lowestAttendance = attendancePercent;
        lowestAttendanceClass = classDoc.class_name;
      }
    }

    console.log('✅ Dashboard data compiled successfully');
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        overallAttendance: parseFloat(overallAttendance),
        todayAttendance: parseFloat(todayAttendancePercentage),
        totalFeesCollected,
        totalFeesPending,
        totalFeesAmount,
        feesCollectionPercentage: parseFloat(feesCollectionPercentage),
        pendingAssignments,
        completedAssignments,
        upcomingEvents,
        recentNotifications,
        activeStudents,
        absentToday,
        defaulters,
        topPerformingClass,
        lowestAttendanceClass
      }
    });

  } catch (error) {
    console.error('❌ DASHBOARD ERROR:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// GET CLASS LIST
// ============================================
const getClassList = async (req, res) => {
  console.log('\n========================================');
  console.log('📚 GET CLASS LIST REQUEST');
  console.log('========================================');
  console.log('School ID:', req.params.school_id);
  
  try {
    const { school_id } = req.params;

    console.log('🔍 Fetching classes...');
    const classes = await ClassModel.find({ school_id })
      .select('class_name')
      .sort({ class_name: 1 });

    const classList = classes.map(c => c.class_name);

    console.log(`✅ Found ${classList.length} classes`);
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Class list retrieved successfully',
      data: { classList }
    });

  } catch (error) {
    console.error('❌ GET CLASS LIST ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// GET CLASS DATA
// ============================================
const getClassData = async (req, res) => {
  console.log('\n========================================');
  console.log('📊 GET CLASS DATA REQUEST');
  console.log('========================================');
  console.log('School ID:', req.params.school_id);
  console.log('Class Name:', req.params.class_name);
  
  try {
    const { school_id, class_name } = req.params;

    console.log('🔍 Finding class...');
    const classDoc = await ClassModel.findOne({
      school_id,
      class_name
    }).populate('class_teacher');

    if (!classDoc) {
      console.log('❌ Class not found');
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    console.log(`✅ Class found: ${classDoc.class_name}`);

    const students = await Student.find({ class_id: classDoc._id, school_id });

    // Calculate statistics
    const totalStudents = students.length;
    const maleStudents = students.filter(s => s.gender === 'Male').length;
    const femaleStudents = students.filter(s => s.gender === 'Female').length;

    console.log(`Students: ${totalStudents}`);

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayAttendance = await Attendance.find({
      class_id: classDoc._id,
      date: { $gte: today, $lte: todayEnd }
    });

    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const absentToday = todayAttendance.filter(a => a.status === 'absent').length;

    // Calculate average attendance
    let totalAttendancePercentage = 0;
    for (const student of students) {
      const records = await Attendance.find({ student_id: student._id });
      if (records.length > 0) {
        const present = records.filter(r => r.status === 'present').length;
        totalAttendancePercentage += (present / records.length) * 100;
      }
    }
    const averageAttendance = totalStudents > 0
      ? (totalAttendancePercentage / totalStudents).toFixed(1)
      : 0;

    // Fee statistics
    let totalFees = 0;
    let collectedFees = 0;
    let pendingFees = 0;

    students.forEach(s => {
      if (s.fee) {
        totalFees += s.fee.total_amount || 0;
        collectedFees += s.fee.paid_amount || 0;
        pendingFees += s.fee.pending_amount || 0;
      }
    });

    const collectionPercentage = totalFees > 0
      ? ((collectedFees / totalFees) * 100).toFixed(1)
      : 0;

    // Performance distribution (placeholder)
    const excellent = students.filter(s => true).length;
    const good = 0;
    const average = 0;

    // Format student data
    const studentsData = students.map(s => ({
      studentId: s._id,
      name: s.name,
      rollNumber: s.rollnumber,
      photo: s.photo,
      attendancePercentage: 0,
      totalFees: s.fee?.total_amount || 0,
      paidFees: s.fee?.paid_amount || 0,
      pendingFees: s.fee?.pending_amount || 0,
      paymentStatus: s.fee?.paid_amount >= s.fee?.total_amount ? 'Paid' 
        : s.fee?.paid_amount > 0 ? 'Partial' : 'Unpaid',
      averageMarks: 0
    }));

    console.log('✅ Class data compiled');
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Class data retrieved successfully',
      data: {
        className: classDoc.class_name,
        classTeacher: classDoc.class_teacher?.name || 'Not assigned',
        totalStudents,
        maleStudents,
        femaleStudents,
        summary: {
          averageAttendance: parseFloat(averageAttendance),
          presentToday,
          absentToday,
          totalFees,
          collectedFees,
          pendingFees,
          collectionPercentage: parseFloat(collectionPercentage),
          averagePerformance: 0
        },
        performanceDistribution: {
          excellent,
          good,
          average
        },
        students: studentsData
      }
    });

  } catch (error) {
    console.error('❌ GET CLASS DATA ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// GET ATTENDANCE REPORTS
// ============================================
const getAttendanceReports = async (req, res) => {
  console.log('\n========================================');
  console.log('📅 ATTENDANCE REPORTS REQUEST');
  console.log('========================================');
  console.log('School ID:', req.params.school_id);
  console.log('Query:', req.query);
  
  try {
    const { school_id } = req.params;
    const { month, class: className } = req.query;

    const totalStudents = await Student.countDocuments({ school_id });

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayRecords = await Attendance.find({ 
      class_id: { $exists: true },
      date: { $gte: today, $lte: todayEnd }
    });
    const presentToday = todayRecords.filter(a => a.status === 'present').length;
    const absentToday = todayRecords.filter(a => a.status === 'absent').length;
    const todayAttendancePercentage = totalStudents > 0
      ? ((presentToday / totalStudents) * 100).toFixed(1)
      : 0;

    // Overall attendance
    const allRecords = await Attendance.find({ class_id: { $exists: true } });
    const presentCount = allRecords.filter(a => a.status === 'present').length;
    const averageAttendance = allRecords.length > 0
      ? ((presentCount / allRecords.length) * 100).toFixed(1)
      : 0;

    // Class-wise attendance
    const classes = await ClassModel.find({ school_id });
    const classWiseAttendance = [];

    for (const classDoc of classes) {
      const classStudents = await Student.countDocuments({ class_id: classDoc._id });
      const classToday = await Attendance.find({
        class_id: classDoc._id,
        date: { $gte: today, $lte: todayEnd }
      });

      const classPresentToday = classToday.filter(a => a.status === 'present').length;
      const classAbsentToday = classToday.filter(a => a.status === 'absent').length;

      const classRecords = await Attendance.find({ class_id: classDoc._id });
      const classPresent = classRecords.filter(a => a.status === 'present').length;
      const classAvg = classRecords.length > 0
        ? ((classPresent / classRecords.length) * 100).toFixed(1)
        : 0;

      classWiseAttendance.push({
        className: classDoc.class_name,
        totalStudents: classStudents,
        averageAttendance: parseFloat(classAvg),
        presentToday: classPresentToday,
        absentToday: classAbsentToday
      });
    }

    // Monthly trend (last 7 days)
    const monthlyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      const dayRecords = await Attendance.find({ 
        class_id: { $exists: true },
        date: { $gte: date, $lte: dateEnd }
      });
      const dayPresent = dayRecords.filter(a => a.status === 'present').length;
      const dayTotal = dayRecords.length;

      const percentage = dayTotal > 0
        ? ((dayPresent / dayTotal) * 100).toFixed(1)
        : 0;

      monthlyTrend.push({
        date: date.toISOString().split('T')[0],
        percentage: parseFloat(percentage)
      });
    }

    // Defaulters (attendance < 75%)
    const students = await Student.find({ school_id });
    const defaulters = [];

    for (const student of students) {
      const studentRecords = await Attendance.find({ student_id: student._id });
      if (studentRecords.length === 0) continue;

      const studentPresent = studentRecords.filter(r => r.status === 'present').length;
      const attendancePercentage = (studentPresent / studentRecords.length) * 100;

      if (attendancePercentage < 75) {
        const classDoc = await ClassModel.findById(student.class_id);
        defaulters.push({
          studentId: student._id,
          name: student.name,
          class: classDoc?.class_name || 'Unknown',
          rollNumber: student.rollnumber,
          attendancePercentage: attendancePercentage.toFixed(1),
          totalDays: studentRecords.length,
          presentDays: studentPresent,
          absentDays: studentRecords.length - studentPresent,
          photo: student.photo
        });
      }
    }

    // Attendance distribution
    let excellent = 0;
    let good = 0;
    let poor = defaulters.length;

    for (const student of students) {
      const records = await Attendance.find({ student_id: student._id });
      if (records.length === 0) continue;
      const present = records.filter(r => r.status === 'present').length;
      const percentage = (present / records.length) * 100;
      if (percentage >= 90) excellent++;
      else if (percentage >= 75) good++;
    }

    const classList = classes.map(c => c.class_name);

    console.log('✅ Attendance report compiled');
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Attendance reports retrieved successfully',
      data: {
        summary: {
          totalStudents,
          averageAttendance: parseFloat(averageAttendance),
          presentToday,
          absentToday,
          totalWorkingDays: 22,
          todayAttendancePercentage: parseFloat(todayAttendancePercentage)
        },
        classWiseAttendance,
        monthlyTrend,
        defaulters,
        attendanceDistribution: {
          excellent,
          good,
          poor
        },
        classList
      }
    });

  } catch (error) {
    console.error('❌ ATTENDANCE REPORTS ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// GET FINANCIAL REPORTS
// ============================================
const getFinancialReports = async (req, res) => {
  console.log('\n========================================');
  console.log('💰 FINANCIAL REPORTS REQUEST');
  console.log('========================================');
  console.log('School ID:', req.params.school_id);
  
  try {
    const { school_id } = req.params;

    const students = await Student.find({ school_id }).select('fee class_id');

    let totalRevenue = 0;
    let expectedRevenue = 0;
    let pendingAmount = 0;
    let totalTransactions = 0;

    students.forEach(s => {
      if (s.fee) {
        totalRevenue += s.fee.paid_amount || 0;
        expectedRevenue += s.fee.total_amount || 0;
        pendingAmount += s.fee.pending_amount || 0;
        totalTransactions += s.fee.payment_records?.length || 0;
      }
    });

    const collectionPercentage = expectedRevenue > 0
      ? ((totalRevenue / expectedRevenue) * 100).toFixed(1)
      : 0;

    const averageTransactionValue = totalTransactions > 0
      ? Math.floor(totalRevenue / totalTransactions)
      : 0;

    // Monthly trends (placeholder)
    const monthlyTrends = [
      { month: 'Aug', revenue: 580000, target: 750000 },
      { month: 'Sep', revenue: 620000, target: 750000 },
      { month: 'Oct', revenue: 710000, target: 750000 },
      { month: 'Nov', revenue: 680000, target: 750000 },
      { month: 'Dec', revenue: 720000, target: 750000 },
      { month: 'Jan', revenue: 940000, target: 900000 }
    ];

    // Payment mode distribution
    let upi = 0, bank = 0, cash = 0, cheque = 0;
    students.forEach(s => {
      if (s.fee?.payment_records) {
        s.fee.payment_records.forEach(p => {
          const amount = p.amount_paid || 0;
          if (p.mode_of_payment === 'UPI') upi += amount;
          else if (p.mode_of_payment === 'Bank Transfer') bank += amount;
          else if (p.mode_of_payment === 'Cash') cash += amount;
          else if (p.mode_of_payment === 'Cheque') cheque += amount;
        });
      }
    });

    // Class-wise revenue
    const classes = await ClassModel.find({ school_id });
    const classWiseRevenue = [];

    for (const classDoc of classes) {
      const classStudents = await Student.find({ class_id: classDoc._id });
      let collected = 0, pending = 0;

      classStudents.forEach(s => {
        if (s.fee) {
          collected += s.fee.paid_amount || 0;
          pending += s.fee.pending_amount || 0;
        }
      });

      classWiseRevenue.push({
        className: classDoc.class_name,
        collected,
        pending
      });
    }

    // Daily collections (last 7 days - placeholder)
    const dailyCollections = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyCollections.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 50000) + 30000
      });
    }

    // Top performing classes
    const topPerformingClasses = classWiseRevenue
      .map(c => ({
        className: c.className,
        percentage: c.collected + c.pending > 0
          ? ((c.collected / (c.collected + c.pending)) * 100).toFixed(1)
          : 0
      }))
      .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
      .slice(0, 3);

    // Payment status breakdown
    const paidStudents = students.filter(s => s.fee?.paid_amount >= s.fee?.total_amount).length;
    const partialStudents = students.filter(s => 
      s.fee?.paid_amount > 0 && s.fee?.paid_amount < s.fee?.total_amount
    ).length;
    const unpaidStudents = students.filter(s => s.fee?.paid_amount === 0).length;

    console.log('✅ Financial report compiled');
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Financial reports retrieved successfully',
      data: {
        summary: {
          totalRevenue,
          expectedRevenue,
          collectionPercentage: parseFloat(collectionPercentage),
          pendingAmount,
          totalTransactions,
          averageTransactionValue
        },
        monthlyTrends,
        paymentModeDistribution: {
          UPI: upi,
          'Bank Transfer': bank,
          Cash: cash,
          Cheque: cheque
        },
        classWiseRevenue,
        dailyCollections,
        topPerformingClasses,
        paymentStatusBreakdown: {
          paidStudents,
          partialStudents,
          unpaidStudents
        }
      }
    });

  } catch (error) {
    console.error('❌ FINANCIAL REPORTS ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// GET ALL STUDENTS
// ============================================
const getAllStudents = async (req, res) => {
  console.log('\n========================================');
  console.log('👨‍🎓 GET ALL STUDENTS REQUEST');
  console.log('========================================');
  console.log('School ID:', req.params.school_id);
  console.log('Query:', req.query);
  
  try {
    const { school_id } = req.params;
    const { class: className, batch, gender, status, searchQuery, paymentStatus } = req.query;

    let query = { school_id };

    if (className) {
      const classDoc = await ClassModel.findOne({ school_id, class_name: className });
      if (classDoc) query.class_id = classDoc._id;
    }

    if (batch) query.batch = batch;
    if (gender) query.gender = gender;

    console.log('🔍 Fetching students with filters:', query);

    const students = await Student.find(query).populate('class_id');

    const totalStudents = students.length;
    const maleStudents = students.filter(s => s.gender === 'Male').length;
    const femaleStudents = students.filter(s => s.gender === 'Female').length;
    const activeStudents = students.filter(s => !s.isBlocked).length;
    const inactiveStudents = students.filter(s => s.isBlocked).length;

    const classes = await ClassModel.find({ school_id });
    const totalClasses = classes.length;

    const classList = classes.map(c => c.class_name).sort();
    const batchList = [...new Set(students.map(s => s.batch))].sort().reverse();

    // Calculate average attendance
    let totalAttendance = 0;
    for (const student of students) {
      const records = await Attendance.find({ student_id: student._id });
      if (records.length > 0) {
        const present = records.filter(r => r.status === 'present').length;
        totalAttendance += (present / records.length) * 100;
      }
    }
    const averageAttendance = totalStudents > 0
      ? (totalAttendance / totalStudents).toFixed(1)
      : 0;

    const studentsData = students.map(s => ({
      studentId: s._id,
      name: s.name,
      class: s.class_id?.class_name || 'Unknown',
      rollNumber: s.rollnumber,
      batch: s.batch,
      gender: s.gender,
      dateOfBirth: s.dob?.toISOString().split('T')[0],
      fatherName: s.father_name,
      motherName: s.mother_name,
      contactNumber: s.mobile,
      email: s.email,
      address: s.address,
      photo: s.photo,
      admissionDate: s.createdAt?.toISOString().split('T')[0],
      status: s.isBlocked ? 'Inactive' : 'Active',
      attendancePercentage: 0,
      totalFees: s.fee?.total_amount || 0,
      paidFees: s.fee?.paid_amount || 0,
      pendingFees: s.fee?.pending_amount || 0,
      paymentStatus: s.fee?.paid_amount >= s.fee?.total_amount ? 'Paid'
        : s.fee?.paid_amount > 0 ? 'Partial' : 'Unpaid'
    }));

    console.log(`✅ Found ${totalStudents} students`);
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Students data retrieved successfully',
      data: {
        totalStudents,
        maleStudents,
        femaleStudents,
        activeStudents,
        inactiveStudents,
        totalClasses,
        averageAttendance: parseFloat(averageAttendance),
        classList,
        batchList,
        students: studentsData
      }
    });

  } catch (error) {
    console.error('❌ GET ALL STUDENTS ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// GET STUDENT FEES
// ============================================
const getStudentFees = async (req, res) => {
  console.log('\n========================================');
  console.log('💵 GET STUDENT FEES REQUEST');
  console.log('========================================');
  console.log('Student ID:', req.params.student_id);
  
  try {
    const { student_id } = req.params;

    const student = await Student.findById(student_id).populate('class_id');

    if (!student) {
      console.log('❌ Student not found');
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log(`✅ Student found: ${student.name}`);

    const paymentHistory = (student.fee?.payment_records || []).map((p, idx) => ({
      paymentId: `PAY${String(idx + 1).padStart(3, '0')}`,
      amount: p.amount_paid,
      paymentDate: p.payment_date?.toISOString().split('T')[0],
      paymentMode: p.mode_of_payment,
      transactionId: `TXN${Date.now()}${idx}`,
      receiptNumber: `RCP/2024/${String(idx + 1).padStart(3, '0')}`,
      remarks: '',
      collectedBy: p.uploaded_by?.toString() || 'Staff',
      paymentProof: p.payment_proof || null
    }));

    const totalFees = student.fee?.total_amount || 0;
    const paidFees = student.fee?.paid_amount || 0;
    const pendingFees = student.fee?.pending_amount || 0;

    const paymentStatus = paidFees >= totalFees ? 'Paid'
      : paidFees > 0 ? 'Partial' : 'Unpaid';

    console.log('✅ Fee data compiled');
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Student fees data retrieved successfully',
      data: {
        studentId: student._id,
        name: student.name,
        class: student.class_id?.class_name || 'Unknown',
        rollNumber: student.rollnumber,
        batch: student.batch,
        photo: student.photo,
        fatherName: student.father_name,
        motherName: student.mother_name,
        contactNumber: student.mobile,
        email: student.email,
        address: student.address,
        totalFees,
        paidFees,
        pendingFees,
        paymentStatus,
        discount: 0,
        lateFee: 0,
        concession: 0,
        netPayable: totalFees,
        feesBreakdown: {
          tuitionFee: Math.floor(totalFees * 0.6),
          admissionFee: Math.floor(totalFees * 0.1),
          examFee: Math.floor(totalFees * 0.1),
          libraryFee: Math.floor(totalFees * 0.05),
          sportsFee: Math.floor(totalFees * 0.05),
          labFee: Math.floor(totalFees * 0.05),
          transportFee: Math.floor(totalFees * 0.05)
        },
        paymentHistory,
        installments: [],
        paymentModeBreakdown: {
          UPI: 0,
          'Bank Transfer': 0,
          Cash: paidFees,
          Cheque: 0
        },
        lastPaymentDate: paymentHistory.length > 0
          ? paymentHistory[paymentHistory.length - 1].paymentDate
          : null,
        nextDueDate: null,
        daysOverdue: 0
      }
    });

  } catch (error) {
    console.error('❌ GET STUDENT FEES ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// GET FEES OVERVIEW
// ============================================
const getFeesOverview = async (req, res) => {
  console.log('\n========================================');
  console.log('💰 FEES OVERVIEW REQUEST');
  console.log('========================================');
  console.log('School ID:', req.params.school_id);
  
  try {
    const { school_id } = req.params;

    const students = await Student.find({ school_id }).populate('class_id');

    let totalFeesAmount = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let paidStudents = 0;
    let partiallyPaid = 0;
    let unpaidStudents = 0;

    students.forEach(s => {
      if (s.fee) {
        totalFeesAmount += s.fee.total_amount || 0;
        totalCollected += s.fee.paid_amount || 0;
        totalPending += s.fee.pending_amount || 0;

        if (s.fee.paid_amount >= s.fee.total_amount) paidStudents++;
        else if (s.fee.paid_amount > 0) partiallyPaid++;
        else unpaidStudents++;
      }
    });

    const collectionPercentage = totalFeesAmount > 0
      ? ((totalCollected / totalFeesAmount) * 100).toFixed(1)
      : 0;

    // Class-wise summary
    const classes = await ClassModel.find({ school_id });
    const classWiseSummary = [];

    for (const classDoc of classes) {
      const classStudents = await Student.find({ class_id: classDoc._id });
      let totalFees = 0, collected = 0, pending = 0;

      classStudents.forEach(s => {
        if (s.fee) {
          totalFees += s.fee.total_amount || 0;
          collected += s.fee.paid_amount || 0;
          pending += s.fee.pending_amount || 0;
        }
      });

      const classCollectionPercentage = totalFees > 0
        ? ((collected / totalFees) * 100).toFixed(1)
        : 0;

      classWiseSummary.push({
        className: classDoc.class_name,
        totalFees,
        collected,
        pending,
        students: classStudents.length,
        collectionPercentage: parseFloat(classCollectionPercentage)
      });
    }

    const studentsData = students.map(s => ({
      studentId: s._id,
      name: s.name,
      class: s.class_id?.class_name || 'Unknown',
      rollNumber: s.rollnumber,
      totalFees: s.fee?.total_amount || 0,
      paidFees: s.fee?.paid_amount || 0,
      pendingFees: s.fee?.pending_amount || 0,
      paymentStatus: s.fee?.paid_amount >= s.fee?.total_amount ? 'Paid'
        : s.fee?.paid_amount > 0 ? 'Partial' : 'Unpaid',
      lastPaymentDate: s.fee?.payment_records?.length > 0
        ? s.fee.payment_records[s.fee.payment_records.length - 1].payment_date?.toISOString().split('T')[0]
        : null,
      photo: s.photo
    }));

    const classList = classes.map(c => c.class_name).sort();

    console.log('✅ Fees overview compiled');
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Fees overview data retrieved successfully',
      data: {
        totalFeesAmount,
        totalCollected,
        totalPending,
        collectionPercentage: parseFloat(collectionPercentage),
        totalStudents: students.length,
        paidStudents,
        partiallyPaid,
        unpaidStudents,
        classWiseSummary,
        students: studentsData,
        classList
      }
    });

  } catch (error) {
    console.error('❌ FEES OVERVIEW ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// GET ALL STAFF
// ============================================
const getAllStaff = async (req, res) => {
  console.log('\n========================================');
  console.log('👨‍🏫 GET ALL STAFF REQUEST');
  console.log('========================================');
  console.log('School ID:', req.params.school_id);
  console.log('Query:', req.query);
  
  try {
    const { school_id } = req.params;
    const { role, department, searchQuery, status } = req.query;

    let query = { school_id };

    // Apply filters
    if (role) query.role = role;
    if (department) query.subject = department;
    if (status) {
      query.isActive = status === 'Active';
    }

    console.log('🔍 Fetching staff with filters:', query);

    let staff = await Staff.find(query).lean();

    // Search query filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      staff = staff.filter(s => 
        s.name?.toLowerCase().includes(searchLower) ||
        s.username?.toLowerCase().includes(searchLower) ||
        s.subject?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate summary
    const totalStaff = staff.length;
    const totalTeachers = staff.filter(s => s.subject).length;
    const adminStaff = staff.filter(s => !s.subject && s.name?.toLowerCase().includes('principal')).length;
    const supportStaff = totalStaff - totalTeachers - adminStaff;

    // Today's attendance (placeholder)
    const presentToday = totalStaff;
    const absentToday = 0;

    // Get class assignments for each staff
    const classes = await ClassModel.find({ school_id }).lean();
    
    // Build staff data array
    const staffData = await Promise.all(staff.map(async (s) => {
      // Find if class teacher
      const classTeacherOf = classes.find(c => c.class_teacher?.toString() === s._id.toString());
      
      // Find assigned classes
      const assignedClasses = classTeacherOf ? [classTeacherOf.class_name] : [];

      return {
        staffId: s._id,
        name: s.name || 'Unknown',
        role: s.subject ? 'Teacher' : (s.name?.toLowerCase().includes('principal') ? 'Admin' : 'Support Staff'),
        department: s.subject || 'Administration',
        photo: s.photo || 'https://via.placeholder.com/150',
        email: s.email || '',
        phone: s.mobile || '',
        joiningDate: s.createdAt ? s.createdAt.toISOString().split('T')[0] : null,
        experience: s.experience || '0 years',
        qualification: s.about || 'Not specified',
        assignedClasses: assignedClasses,
        isClassTeacher: !!classTeacherOf,
        classTeacherOf: classTeacherOf ? classTeacherOf.class_name : null,
        status: s.isActive !== false ? 'Active' : 'Inactive'
      };
    }));

    // Sort by name
    staffData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log(`✅ Found ${totalStaff} staff members`);
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      message: 'Staff data retrieved successfully',
      data: {
        summary: {
          totalStaff,
          totalTeachers,
          adminStaff,
          supportStaff,
          presentToday,
          absentToday
        },
        staff: staffData
      }
    });

  } catch (error) {
    console.error('❌ GET ALL STAFF ERROR:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardOverview,
  getClassList,
  getClassData,
  getAttendanceReports,
  getFinancialReports,
  getAllStudents,
  getStudentFees,
  getFeesOverview,
  getAllStaff
};