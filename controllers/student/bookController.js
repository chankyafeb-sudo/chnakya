const mongoose = require('mongoose');
const ClassModel = require('../../models/class');
const Book = require('../../models/book');
const Student = require('../../models/student');

// GET books - IGNORES URL parameter, uses TOKEN userId
const getBooksByClassId = async (req, res) => {
  console.log('\n========================================');
  console.log('📚 GET BOOKS BY CLASS ID REQUEST');
  console.log('========================================');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // ✅ Get class_id from URL parameter
    const classId = req.params.classid;
    console.log('Class ID from URL:', classId);

    if (!classId) {
      console.log('❌ No class ID provided');
      return res.status(400).json({ 
        success: false, 
        error: 'Class ID is required' 
      });
    }

    // ✅ GET CLASS DETAILS
    const classDoc = await ClassModel.findById(classId)
      .select('class_name school_id')
      .lean();
    
    if (!classDoc) {
      console.log('❌ Class not found for ID:', classId);
      return res.status(404).json({ 
        success: false, 
        error: 'Class not found' 
      });
    }

    console.log(`✅ Class: ${classDoc.class_name}`);
    console.log(`📚 Class ID: ${classId}`);
    console.log(`🏫 School ID: ${classDoc.school_id}`);

    // ✅ GET BOOKS FOR THIS CLASS
    const books = await Book.find({ class_id: classId })
      .select('-__v')
      .lean();

    console.log(`✅ Found ${books.length} books for class ${classDoc.class_name}`);
    console.log('📦 BOOKS DATA SENDING TO FRONTEND:');
    console.log(JSON.stringify(books, null, 2));
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      className: classDoc.class_name,
      classId: classId,
      count: books.length,
      books: books
    });

  } catch (error) {
    console.error('❌ GET BOOKS ERROR:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
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