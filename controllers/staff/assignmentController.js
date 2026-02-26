const mongoose = require("mongoose");
const ClassModel = require("../../models/class"); // adjust path if needed
const School = require("../../models/school"); // adjust path if needed
const Staff = require("../../models/staff"); // adjust path if needed
const Assignment = require('../../models/assignment');
const Student = require('../../models/student');
/**
 * GET /staff/:staffid
 * - Given a staff id, find the school(s) that include this staff (School.staff array)
 * - Then return all classes for those school(s): { _id, class_name }
 * - If no school found, fallback to classes where class_teacher === staffId
 * - Console.log the JSON response before sending
 */
const getClassListByStaffId = async (req, res) => {
  try {
    const { staffid } = req.params;

    // validate staff id
    if (!staffid || !mongoose.Types.ObjectId.isValid(staffid)) {
      return res.status(400).json({ error: "Invalid staff id" });
    }

    const staffObjectId = new mongoose.Types.ObjectId(staffid);

    // optional: confirm staff exists
    const staffDoc = await Staff.findById(staffObjectId)
      .select("_id name")
      .lean()
      .exec();
    if (!staffDoc) {
      return res.status(404).json({ error: "Staff not found" });
    }

    // Find schools that list this staff in their staff array
    const schools = await School.find({ staff: staffObjectId })
      .select("_id name")
      .lean()
      .exec();

    let schoolIds = [];
    if (Array.isArray(schools) && schools.length > 0) {
      schoolIds = schools.map((s) => s._id);
    }

    let classes = [];

    if (schoolIds.length > 0) {
      // Find classes belonging to these schools
      classes = await ClassModel.find({ school_id: { $in: schoolIds } })
        .select("_id class_name school_id")
        .lean()
        .exec();
    }

    // If no classes found via school (or no school found), fallback to classes where this staff is class_teacher
    if (!classes || classes.length === 0) {
      const fallback = await ClassModel.find({ class_teacher: staffObjectId })
        .select("_id class_name school_id")
        .lean()
        .exec();
      if (fallback && fallback.length > 0) {
        classes = fallback;
      }
    }

    // Format response: only id and name per your request
    const resultList = (classes || []).map((c) => ({
      id: String(c._id),
      name: c.class_name || "",
      // optional extras if you want: schoolId: c.school_id ? String(c.school_id) : null
    }));

    const response = {
      staff: { id: String(staffDoc._id), name: staffDoc.name || "" },
      classes: resultList,
      count: resultList.length,
    };

    // Console.log the JSON response before sending (as requested)
    console.log(JSON.stringify(response, null, 2));

    return res.json(response);
  } catch (err) {
    console.error("getClassListByStaffId error:", err && (err.stack || err));
    return res.status(500).json({ error: "Internal server error" });
  }
};



// GET /classes/:classid/assignments-with-status
const getAssignmentsByClassId = async (req, res) => {
  try {
    const classId = req.params.classid || req.params.class_id || req.params.id;
    console.log('GET assignments request for class id:', classId);

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ error: 'Invalid class id' });
    }

    const classObjectId = new mongoose.Types.ObjectId(classId);

    // Confirm class exists
    const classExists = await ClassModel.findById(classObjectId)
      .select('_id class_name')
      .lean()
      .exec();
    if (!classExists) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Fetch all assignments for the class
    const assignments = await Assignment.find({ class_id: classObjectId })
      .select('_id title description subject difficulty max_marks dueDate submissions')
      .lean()
      .exec();

    // Collect all student IDs across all submissions (for name mapping)
    const studentIdSet = new Set();
    assignments.forEach((asgn) => {
      if (Array.isArray(asgn.submissions)) {
        asgn.submissions.forEach((sub) => {
          if (sub && sub.student_id) {
            const sid = String(sub.student_id._id || sub.student_id);
            if (mongoose.Types.ObjectId.isValid(sid)) studentIdSet.add(sid);
          }
        });
      }
    });

    const allStudentIds = Array.from(studentIdSet);

    // Fetch student names for all involved students
    let studentsMap = {};
    if (allStudentIds.length > 0) {
      const students = await Student.find({ _id: { $in: allStudentIds } })
        .select('_id name')
        .lean()
        .exec();
      studentsMap = students.reduce((acc, s) => {
        acc[String(s._id)] = s.name || '';
        return acc;
      }, {});
    }

    // Build response per assignment
    const result = assignments.map((asgn) => {
      const pendingStudents = [];
      const gradedStudents = [];

      if (Array.isArray(asgn.submissions)) {
        asgn.submissions.forEach((sub) => {
          if (!sub || !sub.student_id) return;

          const sid = String(sub.student_id._id || sub.student_id);
          const studentName = studentsMap[sid] || '';

          const entry = {
            id: sid,
            name: studentName,
            status: sub.status || 'Pending',
            submission_date: sub.submission_date || null,
            obtained_grade: sub.obtained_grade || null
          };

          // Only Pending and Graded students will be listed
          switch ((sub.status || '').toLowerCase()) {
            case 'graded':
              gradedStudents.push(entry);
              break;
            default:
              // includes "Pending" and anything else not graded/submitted
              if ((sub.status || '').toLowerCase() !== 'submitted') {
                pendingStudents.push(entry);
              }
              break;
          }
        });
      }

      return {
        id: String(asgn._id),
        title: asgn.title,
        description: asgn.description || '',
        subject: asgn.subject || '',
        difficulty: asgn.difficulty || '',
        max_marks: asgn.max_marks || '',
        dueDate: asgn.dueDate || null,
        counts: {
          pending: pendingStudents.length,
          graded: gradedStudents.length,
          total: pendingStudents.length + gradedStudents.length
        },
        pendingStudents,
        gradedStudents
      };
    });

    const response = {
      class: {
        id: String(classExists._id),
        name: classExists.class_name || ''
      },
      assignments: result,
      totalAssignments: result.length
    };

    console.log('GET assignments response:', JSON.stringify(response, null, 2));
    return res.status(200).json(response);
  } catch (err) {
    console.error('getAssignmentsByClassId error:', err && (err.stack || err));
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// PATCH /assignments/:assignmentid/submission
const getAssignmentsByAssignmentId = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentid || req.params.assignment_id || req.params.id;
    console.log('Incoming update for assignment id:', assignmentId);
    console.log('Incoming body:', JSON.stringify(req.body, null, 2));

    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment id' });
    }

    const { student_id, status, submission_date, obtained_grade } = req.body;

    if (!student_id || !mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ error: 'Invalid or missing student_id in body' });
    }

    // Optional: validate status if provided
    const allowedStatuses = ['Pending', 'Submitted', 'Graded'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const assignmentObjectId = new mongoose.Types.ObjectId(assignmentId);
    const studentObjectId = new mongoose.Types.ObjectId(student_id);

    // Find assignment
    const assignment = await Assignment.findById(assignmentObjectId).exec();
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Find existing submission entry for this student (match by ObjectId)
    let submissionIndex = -1;
    if (Array.isArray(assignment.submissions)) {
      submissionIndex = assignment.submissions.findIndex((s) => {
        if (!s || !s.student_id) return false;
        return String(s.student_id) === String(studentObjectId);
      });
    } else {
      assignment.submissions = [];
    }

    const now = submission_date ? new Date(submission_date) : new Date();

    if (submissionIndex === -1) {
      // No existing submission entry; create one
      const newSub = {
        student_id: studentObjectId,
        status: status || 'Submitted', // default to Submitted if updating without existing entry
        submission_date: submission_date ? new Date(submission_date) : now,
        obtained_grade: obtained_grade || null
      };
      assignment.submissions.push(newSub);
      console.log('Added new submission entry for student:', String(studentObjectId));
    } else {
      // Update existing submission
      const sub = assignment.submissions[submissionIndex];
      if (status) sub.status = status;
      // if submission_date provided, set it; else don't overwrite unless status becomes Submitted
      if (typeof submission_date !== 'undefined' && submission_date !== null) {
        sub.submission_date = new Date(submission_date);
      } else if (status && status.toLowerCase() === 'submitted' && !sub.submission_date) {
        sub.submission_date = now;
      }
      if (typeof obtained_grade !== 'undefined') {
        sub.obtained_grade = obtained_grade;
      }
      console.log('Updated existing submission entry for student:', String(studentObjectId));
    }

    // Save assignment
    const savedAssignment = await assignment.save();
    console.log('Saved assignment after submission update:', JSON.stringify(
      {
        id: String(savedAssignment._id),
        submissionsCount: savedAssignment.submissions ? savedAssignment.submissions.length : 0
      },
      null,
      2
    ));

    // Also update Student.assignments array: find element with assignment_id and set status
    const studentDoc = await Student.findById(studentObjectId).exec();
    if (studentDoc) {
      let updatedInStudent = false;
      if (Array.isArray(studentDoc.assignments)) {
        for (let i = 0; i < studentDoc.assignments.length; i++) {
          const item = studentDoc.assignments[i];
          if (item && String(item.assignment_id) === String(assignmentObjectId)) {
            if (status) item.status = status;
            // you may want to store submission_date/grade in student's assignment entry too - update if fields exist
            updatedInStudent = true;
            break;
          }
        }
      } else {
        studentDoc.assignments = [];
      }

      // If not present in student.assignments, push one
      if (!updatedInStudent) {
        studentDoc.assignments.push({
          assignment_id: assignmentObjectId,
          status: status || 'Submitted'
        });
        updatedInStudent = true;
      }

      if (updatedInStudent) {
        await studentDoc.save();
        console.log('Updated student assignments for student:', String(studentObjectId));
      }
    } else {
      console.log('Student not found for id (student assignments not updated):', String(studentObjectId));
    }

    // Build response: return updated submission entry
    const updatedSubmission = (savedAssignment.submissions || []).find((s) => String(s.student_id) === String(studentObjectId));

    return res.status(200).json({
      message: 'Submission updated for assignment',
      assignmentId: String(savedAssignment._id),
      submission: updatedSubmission ? {
        student_id: String(updatedSubmission.student_id),
        status: updatedSubmission.status,
        submission_date: updatedSubmission.submission_date || null,
        obtained_grade: updatedSubmission.obtained_grade || null
      } : null
    });
  } catch (err) {
    console.error('getAssignmentsByAssignmentId error:', err && (err.stack || err));
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// PUT /staff/class/:assignmentid
const updateSubmissionByAssignmentId = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentid || req.params.assignment_id || req.params.id;
    console.log('PUT update for assignment id:', assignmentId);
    console.log('Incoming body:', JSON.stringify(req.body, null, 2));

    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment id' });
    }

    const { student_id, status, submission_date, obtained_grade } = req.body;

    if (!student_id || !mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ error: 'Invalid or missing student_id in body' });
    }

    const allowedStatuses = ['Pending', 'Submitted', 'Graded'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const assignmentObjectId = new mongoose.Types.ObjectId(assignmentId);
    const studentObjectId = new mongoose.Types.ObjectId(student_id);

    // Load assignment document (not lean because we will save)
    const assignment = await Assignment.findById(assignmentObjectId).exec();
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // find existing submission index
    if (!Array.isArray(assignment.submissions)) assignment.submissions = [];
    let idx = assignment.submissions.findIndex((s) => s && String(s.student_id) === String(studentObjectId));

    const now = submission_date ? new Date(submission_date) : new Date();

    if (idx === -1) {
      // create new submission record
      const newSub = {
        student_id: studentObjectId,
        status: status || 'Submitted',
        submission_date: submission_date ? new Date(submission_date) : (status && status.toLowerCase() === 'submitted' ? now : null),
        obtained_grade: typeof obtained_grade !== 'undefined' ? obtained_grade : null
      };
      assignment.submissions.push(newSub);
      console.log('Added new submission for student:', String(studentObjectId));
    } else {
      // update existing
      const sub = assignment.submissions[idx];
      if (status) sub.status = status;
      if (typeof submission_date !== 'undefined' && submission_date !== null) {
        sub.submission_date = new Date(submission_date);
      } else if (status && status.toLowerCase() === 'submitted' && !sub.submission_date) {
        sub.submission_date = now;
      }
      if (typeof obtained_grade !== 'undefined') sub.obtained_grade = obtained_grade;
      console.log('Updated existing submission for student:', String(studentObjectId));
    }

    // Save assignment
    const savedAssignment = await assignment.save();
    console.log('Saved assignment after update:', String(savedAssignment._id));

    // Update student's assignments array (status)
    const studentDoc = await Student.findById(studentObjectId).exec();
    if (studentDoc) {
      if (!Array.isArray(studentDoc.assignments)) studentDoc.assignments = [];

      let found = false;
      for (let i = 0; i < studentDoc.assignments.length; i++) {
        const item = studentDoc.assignments[i];
        if (item && String(item.assignment_id) === String(assignmentObjectId)) {
          if (status) item.status = status;
          found = true;
          break;
        }
      }

      if (!found) {
        studentDoc.assignments.push({ assignment_id: assignmentObjectId, status: status || 'Submitted' });
      }

      await studentDoc.save();
      console.log('Updated student.assignments for student:', String(studentObjectId));
    } else {
      console.log('Student not found, skipped student.assignments update:', String(studentObjectId));
    }

    // Return the updated submission record
    const updatedSub = (savedAssignment.submissions || []).find((s) => String(s.student_id) === String(studentObjectId));

    return res.status(200).json({
      message: 'Submission record updated',
      assignmentId: String(savedAssignment._id),
      submission: updatedSub ? {
        student_id: String(updatedSub.student_id),
        status: updatedSub.status,
        submission_date: updatedSub.submission_date || null,
        obtained_grade: updatedSub.obtained_grade || null
      } : null
    });
  } catch (err) {
    console.error('updateSubmissionByAssignmentId error:', err && (err.stack || err));
    return res.status(500).json({ error: 'Internal server error' });
  }
};




const postAssignmentByClassId = async (req, res) => {
  try {
    // Flexible param name support
    const classId = req.params.classid || req.params.class_id || req.params.id;
    console.log(
      "Incoming request body for assignment create:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("Class id param:", classId);

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ error: "Invalid class id" });
    }
    const classObjectId = new mongoose.Types.ObjectId(classId);

    // Ensure class exists and get students
    const classDoc = await ClassModel.findById(classObjectId)
      .select("students assignments")
      .lean()
      .exec();
    if (!classDoc) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Students array (may be empty) — normalize and validate to ObjectId
    const studentIdsRaw = Array.isArray(classDoc.students) ? classDoc.students : [];
    const studentObjectIds = studentIdsRaw
      .map((s) => {
        // s may be ObjectId or string or object
        let sid = null;
        if (!s) return null;
        if (typeof s === "string") sid = s;
        else if (s._id) sid = String(s._id);
        else sid = String(s);
        return mongoose.Types.ObjectId.isValid(sid) ? new mongoose.Types.ObjectId(sid) : null;
      })
      .filter(Boolean); // only valid ObjectIds

    // Build submissions array for assignment (Pending for each student)
    const submissions = studentObjectIds.map((sid) => ({
      student_id: sid,
      status: "Pending",
      submission_date: null,
      obtained_grade: null,
    }));

    // Prepare assignment payload from body (pick only allowed fields)
    const {
      title,
      description,
      subject = "",
      difficulty = "Medium",
      max_marks,
      dueDate,
    } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ error: "title and dueDate are required" });
    }

    const assignmentPayload = {
      title,
      description,
      subject,
      difficulty,
      max_marks,
      class_id: classObjectId,
      dueDate: new Date(dueDate),
      submissions,
    };

    // Create and save assignment
    const createdAssignment = await Assignment.create(assignmentPayload);
    console.log(
      "Saved Assignment:",
      JSON.stringify(createdAssignment, null, 2)
    );

    // Push assignment id into Class.assignments
    const classUpdate = await ClassModel.findByIdAndUpdate(
      classObjectId,
      { $push: { assignments: createdAssignment._id } },
      { new: true }
    )
      .select("_id assignments")
      .lean()
      .exec();
    console.log(
      "Updated Class (assignments appended):",
      JSON.stringify(classUpdate, null, 2)
    );

    // Update all students: push assignment reference with status Pending
    let studentUpdateResult = null;
    if (studentObjectIds.length > 0) {
      studentUpdateResult = await Student.updateMany(
        { _id: { $in: studentObjectIds } },
        {
          $push: {
            assignments: {
              assignment_id: createdAssignment._id,
              status: "Pending",
            },
          },
        }
      );
      console.log(
        "Students update result:",
        JSON.stringify(studentUpdateResult, null, 2)
      );
    } else {
      console.log("No students in class, skipping student updates.");
    }

    // Response
    return res.status(201).json({
      message: "Assignment created and assigned to students (pending).",
      assignment: {
        id: String(createdAssignment._id),
        title: createdAssignment.title,
        class_id: String(createdAssignment.class_id),
        dueDate: createdAssignment.dueDate,
      },
      assignedCount: studentObjectIds.length,
      assignedStudentIds: studentObjectIds.map((id) => String(id)),
    });
  } catch (err) {
    console.error("postAssignmentByClassId error:", err && (err.stack || err));
    return res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = {
  getClassListByStaffId,
  postAssignmentByClassId,
  getAssignmentsByClassId,
  getAssignmentsByAssignmentId,
  updateSubmissionByAssignmentId

};
