const mongoose = require('mongoose');
const ClassModel = require('../../models/class');
const Book = require('../../models/book');
const Student = require('../../models/student');

// GET books - IGNORES URL parameter, uses TOKEN userId
const getBooksByClassId = async (req, res) => {
  console.log('\n========================================');
  console.log('📚 GET BOOKS REQUEST');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // ✅ IGNORE URL parameter, use TOKEN userId
    const studentId = req.userId; // From token (authMiddleware)
    console.log('Student ID from token:', studentId);
    console.log('URL parameter (ignored):', req.params.classid);

    if (!studentId) {
      console.log('❌ No token userId');
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Get student to find class_id
    const student = await Student.findById(studentId).select('class_id name school_id').lean();
    
    if (!student) {
      console.log('❌ Student not found for ID:', studentId);
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    if (!student.class_id) {
      console.log('❌ Student has no class_id');
      return res.status(404).json({ success: false, error: 'Student not assigned to any class' });
    }

    console.log(`✅ Student: ${student.name}`);
    console.log(`📚 Class ID: ${student.class_id}`);
    console.log(`🏫 School ID: ${student.school_id}`);

    // Get books for this class (Book model: class_id field)
    const books = await Book.find({ class_id: student.class_id })
      .select('-__v')
      .lean();

    console.log(`✅ Found ${books.length} books for class ${student.class_id}`);
    console.log('📦 BOOKS DATA SENDING TO FRONTEND:');
    console.log(JSON.stringify(books, null, 2));
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      count: books.length,
      books: books
    });

  } catch (error) {
    console.error('❌ GET BOOKS ERROR:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const postBookRequest = async (req, res) => {
  console.log('\n📚 BOOK REQUEST');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { book_id } = req.body;
    const student_id = req.userId;

    if (!student_id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!book_id) {
      console.log('❌ Missing book_id');
      return res.status(400).json({ success: false, message: 'book_id is required' });
    }

    // Verify student exists
    const student = await Student.findById(student_id).select('name').lean();
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    console.log(`✅ Student: ${student.name}`);
    console.log(`✅ Book request for book ${book_id}`);

    // TODO: Implement book request logic (create BookRequest record)
    
    return res.status(200).json({
      success: true,
      message: 'Book request submitted successfully'
    });

  } catch (error) {
    console.error('❌ BOOK REQUEST ERROR:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getBooksByClassId,
  postBookRequest
};