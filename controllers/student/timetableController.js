const mongoose = require("mongoose");
const moment = require("moment");
const Timetable = require("../../models/timetable");
const ClassModel = require("../../models/class");
const StudentModel = require("../../models/student");
const Staff = require("../../models/staff");
const { logger } = require("../../utils/logger");

// Create or Update Timetable
exports.createOrUpdateTimetable = async (req, res) => {
  try {
    const classId = req.params.classId; // Class ID should be provided in the URL params
    const timetableId = req.params.id;
    const { subject, start_time, end_time } = req.body;

    // Logs
    console.log("createOrUpdateTimetable - req.params ->", req.params);
    console.log("createOrUpdateTimetable - req.body ->", req.body);
    logger.debug(`Request Body: ${JSON.stringify(req.body)}`);
    logger.debug(`Request Params: ${JSON.stringify(req.params)}`);
    logger.debug(`Fetching Class with ID: ${classId}`);

    // Check if class exists
    const cls = await ClassModel.findById(classId);
    console.log("createOrUpdateTimetable - class fetched ->", cls);
    if (!cls) {
      logger.debug(`Class with ID ${classId} not found`);
      return res.status(404).json({ message: "Class not found" });
    }

    // Create or update timetable
    const timetable = await Timetable.findOneAndUpdate(
      { _id: timetableId, class_id: classId },
      { subject, start_time, end_time },
      { new: true, upsert: true } // Create if it doesn't exist
    ).lean(); // Convert to plain JavaScript object

    console.log("createOrUpdateTimetable - timetable from DB ->", timetable);

    if (timetable) {
      // Format dates
      timetable.start_time = moment(timetable.start_time).format("DD-MM-YYYY");
      timetable.end_time = moment(timetable.end_time).format("DD-MM-YYYY");

      logger.debug(`Timetable created/updated: ${JSON.stringify(timetable)}`);
      console.log("createOrUpdateTimetable - response ->", timetable);
      res.status(200).json(timetable);
    } else {
      res.status(404).json({ message: "Timetable not found" });
    }
  } catch (error) {
    logger.error("Error creating/updating timetable:", error);
    console.error("createOrUpdateTimetable - error ->", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Timetables by Student ID
exports.getTimetablesByStudentId = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log("getTimetablesByStudentId - req.params ->", req.params);
    logger.debug(`Request Params: ${JSON.stringify(req.params)}`);
    logger.debug(`Fetching Student with ID: ${studentId}`);

    // Retrieve student's class ID
    const student = await StudentModel.findById(studentId).populate("class_id");
    console.log("getTimetablesByStudentId - student fetched ->", student);
    if (!student) {
      logger.debug(`Student with ID ${studentId} not found`);
      return res.status(404).json({ message: "Student not found" });
    }

    const classId = student.class_id._id;
    logger.debug(`Fetching Timetables for Class ID: ${classId}`);
    console.log("getTimetablesByStudentId - resolved classId ->", classId);

    const timetables = await Timetable.find({ class_id: classId }).lean(); // Use .lean() to get plain objects
    console.log(
      `getTimetablesByStudentId - timetables fetched (count=${timetables.length}) ->`,
      timetables
    );

    if (timetables.length > 0) {
      // Format dates
      const formattedTimetables = timetables.map(
        ({ _id, $__, $isNew, __v, ...rest }) => {
          // log each raw timetable before formatting
          console.log("getTimetablesByStudentId - raw timetable ->", rest);
          rest.start_time = moment(rest.start_time).format("DD-MM-YYYY");
          rest.end_time = moment(rest.end_time).format("DD-MM-YYYY");
          // log formatted one
          console.log(
            "getTimetablesByStudentId - formatted timetable ->",
            rest
          );
          return rest;
        }
      );

      logger.debug(
        `Timetables for class ${classId}: ${JSON.stringify(
          formattedTimetables
        )}`
      );
      console.log(
        "getTimetablesByStudentId - response ->",
        formattedTimetables
      );
      res.status(200).json(formattedTimetables);
    } else {
      res.status(404).json({ message: "No timetables found for this class" });
    }
  } catch (error) {
    logger.error("Error fetching timetables by student ID:", error);
    console.error("getTimetablesByStudentId - error ->", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get Timetable by ID for Class Teacher
exports.getTimetableById = async (req, res) => {
  try {
    const timetableId = req.params.id;
    const classTeacherId = req.params.classTeacherId; // Class Teacher ID should be provided in the URL params

    console.log("getTimetableById - req.params ->", req.params);
    logger.debug(`Request Params: ${JSON.stringify(req.params)}`);
    logger.debug(`Fetching Class Teacher with ID: ${classTeacherId}`);

    // Retrieve class associated with the class teacher
    const classTeacher = await Staff.findById(classTeacherId).populate(
      "class_id"
    );
    console.log("getTimetableById - classTeacher fetched ->", classTeacher);
    if (!classTeacher) {
      logger.debug(`Class teacher with ID ${classTeacherId} not found`);
      return res.status(404).json({ message: "Class teacher not found" });
    }

    const classId = classTeacher.class_id._id;
    logger.debug(
      `Fetching Timetable with ID: ${timetableId} for Class ID: ${classId}`
    );
    console.log("getTimetableById - resolved classId ->", classId);

    // Fetch timetable
    const timetable = await Timetable.findOne({
      _id: timetableId,
      class_id: classId,
    }).lean(); // Convert to plain JavaScript object
    console.log("getTimetableById - timetable from DB ->", timetable);

    if (timetable) {
      // Format dates
      timetable.start_time = moment(timetable.start_time).format("DD-MM-YYYY");
      timetable.end_time = moment(timetable.end_time).format("DD-MM-YYYY");

      logger.debug(
        `Timetable with ID ${timetableId}: ${JSON.stringify(timetable)}`
      );
      console.log("getTimetableById - response ->", timetable);
      res.status(200).json(timetable);
    } else {
      logger.debug(
        `Timetable with ID ${timetableId} not found for class ${classId}`
      );
      res.status(404).json({ message: "Timetable not found" });
    }
  } catch (error) {
    logger.error("Error fetching timetable by ID:", error);
    console.error("getTimetableById - error ->", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Timetable
exports.updateTimetable = async (req, res) => {
  try {
    const timetableId = req.params.id;
    const classTeacherId = req.params.classTeacherId;

    console.log("updateTimetable - req.body ->", req.body);
    console.log("updateTimetable - req.params ->", req.params);
    logger.debug(`Request Body: ${JSON.stringify(req.body)}`);
    logger.debug(`Request Params: ${JSON.stringify(req.params)}`);
    logger.debug(`Fetching Class Teacher with ID: ${classTeacherId}`);

    // Retrieve class associated with the class teacher
    const classTeacher = await Staff.findById(classTeacherId).populate(
      "class_id"
    );
    console.log("updateTimetable - classTeacher fetched ->", classTeacher);
    if (!classTeacher) {
      logger.debug(`Class teacher with ID ${classTeacherId} not found`);
      return res.status(404).json({ message: "Class teacher not found" });
    }

    const classId = classTeacher.class_id._id;
    logger.debug(
      `Updating Timetable with ID: ${timetableId} for Class ID: ${classId}`
    );
    console.log("updateTimetable - resolved classId ->", classId);

    // Update timetable
    const timetable = await Timetable.findOneAndUpdate(
      { _id: timetableId, class_id: classId },
      req.body,
      { new: true }
    ).lean(); // Convert to plain JavaScript object

    console.log("updateTimetable - timetable after update ->", timetable);

    if (timetable) {
      // Format dates
      timetable.start_time = moment(timetable.start_time).format("DD-MM-YYYY");
      timetable.end_time = moment(timetable.end_time).format("DD-MM-YYYY");

      logger.debug(`Timetable updated: ${JSON.stringify(timetable)}`);
      console.log("updateTimetable - response ->", timetable);
      res.status(200).json(timetable);
    } else {
      res
        .status(404)
        .json({ message: "Timetable not found or not authorized" });
    }
  } catch (error) {
    logger.error("Error updating timetable:", error);
    console.error("updateTimetable - error ->", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete Timetable
exports.deleteTimetable = async (req, res) => {
  try {
    const timetableId = req.params.id;
    const classTeacherId = req.params.classTeacherId;

    console.log("deleteTimetable - req.params ->", req.params);
    logger.debug(`Request Params: ${JSON.stringify(req.params)}`);
    logger.debug(`Fetching Class Teacher with ID: ${classTeacherId}`);

    // Retrieve class associated with the class teacher
    const classTeacher = await Staff.findById(classTeacherId).populate(
      "class_id"
    );
    console.log("deleteTimetable - classTeacher fetched ->", classTeacher);
    if (!classTeacher) {
      logger.debug(`Class teacher with ID ${classTeacherId} not found`);
      return res.status(404).json({ message: "Class teacher not found" });
    }

    const classId = classTeacher.class_id._id;
    logger.debug(
      `Deleting Timetable with ID: ${timetableId} for Class ID: ${classId}`
    );
    console.log("deleteTimetable - resolved classId ->", classId);

    // Delete timetable
    const result = await Timetable.deleteOne({
      _id: timetableId,
      class_id: classId,
    });
    console.log("deleteTimetable - delete result ->", result);

    if (result.deletedCount > 0) {
      logger.debug(`Timetable with ID ${timetableId} deleted`);
      console.log(`deleteTimetable - Timetable with ID ${timetableId} deleted`);
      res.status(200).json({ message: "Timetable deleted" });
    } else {
      res
        .status(404)
        .json({ message: "Timetable not found or not authorized" });
    }
  } catch (error) {
    logger.error("Error deleting timetable:", error);
    console.error("deleteTimetable - error ->", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
