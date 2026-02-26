const mongoose = require("mongoose");
const Assignment = require("../../models/assignment");
const Student = require("../../models/student");

const safeFormatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Get assignments for a student - shows ALL class assignments with submission status
const getAssignmentsByStudentIdAndStatus = async (req, res) => {
  console.log('\n========================================');
  console.log('📝 GET STUDENT ASSIGNMENTS REQUEST');
  console.log('========================================');
  console.log('Student ID:', req.params.studentid);

  try {
    const { studentid } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentid)) {
      console.log('❌ Invalid student ID');
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentid);

    // Step 1: Find student's class
    console.log('🔍 Finding student class...');
    const student = await Student.findById(studentObjectId).select('class_id name').lean();

    if (!student) {
      console.log('❌ Student not found');
      return res.status(404).json({ error: "Student not found" });
    }

    console.log(`✅ Student: ${student.name}, Class ID: ${student.class_id}`);

    // Step 2: Get ALL assignments for that class
    console.log('🔍 Fetching assignments for class...');
    const assignments = await Assignment.find({
      class_id: student.class_id
    })
      .select("title description class_id dueDate submissions subject difficulty max_marks")
      .lean();

    console.log(`✅ Found ${assignments.length} total assignments for class`);

    const submittedAssignments = [];
    const pendingAssignments = [];

    assignments.forEach((assignment) => {
      const subs = Array.isArray(assignment.submissions) ? assignment.submissions : [];
      
      const studentSubmission = subs.find((sub) => {
        try {
          return sub.student_id && String(sub.student_id) === String(studentObjectId);
        } catch (e) {
          return false;
        }
      });

      const assignmentData = {
        title: assignment.title,
        description: assignment.description,
        class_id: assignment.class_id ? String(assignment.class_id) : null,
        dueDate: safeFormatDate(assignment.dueDate),
        subject: assignment.subject || "",
        difficulty: assignment.difficulty || "Medium",
        max_marks: assignment.max_marks || "100",
        student_status: studentSubmission ? studentSubmission.status : "Pending",
      };

      if (studentSubmission && 
          (assignmentData.student_status === "Submitted" || 
           assignmentData.student_status === "Graded")) {
        submittedAssignments.push(assignmentData);
      } else {
        pendingAssignments.push(assignmentData);
      }
    });

    console.log(`📊 Submitted: ${submittedAssignments.length}, Pending: ${pendingAssignments.length}`);
    console.log('📦 ASSIGNMENTS DATA SENDING TO FRONTEND:');
    console.log(JSON.stringify({ submitted: submittedAssignments, pending: pendingAssignments }, null, 2));
    console.log('========================================\n');

    return res.json({
      success: true,
      submitted: submittedAssignments,
      pending: pendingAssignments,
    });

  } catch (err) {
    console.error("❌ GET ASSIGNMENTS ERROR:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getAssignmentsByStudentIdAndStatus,
};
