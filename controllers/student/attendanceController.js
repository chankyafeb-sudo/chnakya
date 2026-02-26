// controllers/attendanceController.js
const mongoose = require("mongoose");
const Attendance = require("../../models/attendance");
const Student = require("../../models/student");
const {
  startOfDayIST,
  startOfNextDayIST,
  startOfMonthIST,
  startOfNextMonthIST,
  formatDateDDMMYYYY,
} = require("../../utils/istDate");

// 🧮 Helper: Count how many Present / Absent / Late / Leave
function countStatus(arr) {
  return arr.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { Present: 0, Absent: 0, Late: 0, Leave: 0 }
  );
}

/** 🔢 Parse dd-mm-yyyy (or dd/mm/yyyy) to a Date in IST */
function parseDDMMYYYY(str) {
  if (!str) return null;
  const s = String(str).trim();
  const sep = s.includes("-") ? "-" : s.includes("/") ? "/" : null;
  if (!sep) return null;
  const parts = s.split(sep).map(Number);
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy) return null;
  // Construct a date at 00:00 IST for that day
  return new Date(
    `${String(yyyy)}-${String(mm).padStart(2, "0")}-${String(dd).padStart(
      2,
      "0"
    )}T00:00:00+05:30`
  );
}

/** 📅 Get full attendance data by studentId (IST-safe) */
const getAttendanceByStudentId = async (req, res) => {
  try {
    const { studentid } = req.params;
    console.log("Received student ID:", studentid);

    if (!studentid || !mongoose.Types.ObjectId.isValid(studentid)) {
      console.error("Invalid student ID format:", studentid);
      return res.status(400).json({ error: "Invalid student ID format" });
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentid);

    // Optional student existence check
    try {
      const s = await Student.findById(studentObjectId)
        .select("_id name")
        .lean()
        .exec();
      if (!s) console.warn("Student not found for id:", studentid);
    } catch (err) {
      console.warn("Student lookup failed (non-fatal):", err.message);
    }

    // ------------------------------
    // 🕒 IST-based date calculations
    // ------------------------------
    const now = new Date();

    // Today (IST)
    const todayStart = startOfDayIST(now); // UTC timestamp for IST midnight today
    const todayEnd = startOfNextDayIST(now); // UTC timestamp for next IST midnight

    // Last 7 days range (in IST)
    const sixDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const sevenStart = sixDaysAgo;
    const sevenEnd = todayEnd;

    // Last 6 months buckets
    const monthBuckets = [];
    for (let i = 0; i < 6; i++) {
      const monthAnchor = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
      );
      const bucketStart = startOfMonthIST(monthAnchor);
      const bucketEnd = startOfNextMonthIST(monthAnchor);
      const labelDate = new Date(bucketStart.getTime());
      const label = labelDate.toLocaleString("en-IN", {
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });
      monthBuckets.push({ bucketStart, bucketEnd, label });
    }

    // Current year range (IST)
    const yearAnchor = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const yearStart = startOfDayIST(yearAnchor);
    const yearEnd = startOfDayIST(
      new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1))
    );

    // Oldest date we need to query
    const earliestNeeded = monthBuckets[monthBuckets.length - 1].bucketStart;

    // 🔍 Debug log: all ranges
    console.log("🔹 Date Ranges Used (IST Adjusted):");
    console.log(
      " todayStart (UTC ISO):",
      todayStart.toISOString(),
      "| IST:",
      new Date(todayStart).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    );
    console.log(
      " todayEnd   (UTC ISO):",
      todayEnd.toISOString(),
      "| IST:",
      new Date(todayEnd).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    );
    console.log(
      " sevenStart (UTC ISO):",
      sevenStart.toISOString(),
      "| IST:",
      new Date(sevenStart).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    );
    console.log(
      " sevenEnd   (UTC ISO):",
      sevenEnd.toISOString(),
      "| IST:",
      new Date(sevenEnd).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    );
    console.log(
      " earliestNeeded (UTC ISO):",
      earliestNeeded.toISOString(),
      "| IST:",
      new Date(earliestNeeded).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })
    );

    // ----------------------------------------
    // 📘 Query Attendance data (IST normalized)
    // ----------------------------------------
    const allAttendance = await Attendance.find({
      student_id: studentObjectId,
      date: { $gte: earliestNeeded, $lt: yearEnd },
    })
      .lean()
      .exec();

    console.log(
      "matched attendance docs:",
      allAttendance.map((a) => ({
        id: String(a._id),
        date_iso: new Date(a.date).toISOString(),
        date_ist: new Date(a.date).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        status: a.status,
      }))
    );

    // ----------------------------
    // 🧩 Filter by range categories
    // ----------------------------
    const yearAttendance = allAttendance.filter((r) => {
      const d = new Date(r.date);
      return d >= yearStart && d < yearEnd;
    });

    const todayAttendance = allAttendance.filter((r) => {
      const d = new Date(r.date);
      return d >= todayStart && d < todayEnd;
    });

    const lastSevenDaysAttendance = allAttendance.filter((r) => {
      const d = new Date(r.date);
      return d >= sevenStart && d < sevenEnd;
    });

    // ----------------------------
    // 📊 Last 6 months aggregation
    // ----------------------------
    const lastSixMonths = {};
    monthBuckets.forEach((b) => {
      const bucketRecords = allAttendance.filter((r) => {
        const d = new Date(r.date);
        return d >= b.bucketStart && d < b.bucketEnd;
      });
      const totals = countStatus(bucketRecords);
      lastSixMonths[b.label] = {
        totalDays: bucketRecords.length,
        presentCount: totals.Present || 0,
        absentCount: totals.Absent || 0,
        lateCount: totals.Late || 0,
        leaveCount: totals.Leave || 0,
      };
    });

    // ----------------------------
    // 🧾 Yearly summary
    // ----------------------------
    const yearTotals = countStatus(yearAttendance);
    const totalYearly =
      (yearTotals.Present || 0) +
      (yearTotals.Absent || 0) +
      (yearTotals.Late || 0) +
      (yearTotals.Leave || 0);

    // ----------------------------
    // 📅 Format attendance dates
    // ----------------------------
    const formatAttendance = (arr) =>
      arr
        .map((r) => ({
          ts: new Date(r.date).getTime(),
          date: formatDateDDMMYYYY(r.date),
          status: r.status,
        }))
        .sort((a, b) => a.ts - b.ts)
        .map((r) => ({ date: r.date, status: r.status }));

    // ----------------------------
    // ✅ Final response
    // ----------------------------
    const response = {
      today: formatAttendance(todayAttendance),
      total_yearly_attendance: {
        total: totalYearly,
        present: yearTotals.Present || 0,
        absent: yearTotals.Absent || 0,
        late: yearTotals.Late || 0,
        leave: yearTotals.Leave || 0,
      },
      last_seven_days: formatAttendance(lastSevenDaysAttendance),
      last_six_months: lastSixMonths,
    };

    console.log("Attendance response for student:", studentid);
    console.log(JSON.stringify(response, null, 2));

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error retrieving attendance:", err.stack || err);
    return res.status(500).json({ error: "Error retrieving attendance" });
  }
};

// ----------------------------
// Export Controller
// ----------------------------
module.exports = {
  getAttendanceByStudentId,
};
