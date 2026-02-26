// utils/istDate.js
// Canonical IST helpers — Indian Standard Time (UTC+05:30).
// All returned Date objects will represent the real IST time
// (e.g., "Tue Oct 14 2025 00:00:00 GMT+0530 (India Standard Time)").

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Normalize input into a Date object in IST.
 */
function toISTDate(input) {
  if (!input) return new Date();
  const d = new Date(input);
  // Return new Date object adjusted to IST offset (local system time zone may vary)
  return new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

/**
 * Get Date object representing midnight (00:00:00) in IST for the given date.
 * Example: 2025-10-14 -> Tue Oct 14 2025 00:00:00 GMT+0530 (IST)
 */
function startOfDayIST(date) {
  const d = toISTDate(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Get Date object representing next day's midnight (00:00:00 IST).
 */
function startOfNextDayIST(date) {
  const d = startOfDayIST(date);
  return new Date(d.getTime() + MS_PER_DAY);
}

/**
 * Get Date object representing first day of the same month at midnight (IST).
 */
function startOfMonthIST(date) {
  const d = toISTDate(date);
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Get Date object representing first day of the next month at midnight (IST).
 */
function startOfNextMonthIST(date) {
  const d = toISTDate(date);
  const nextMonth = d.getMonth() + 1;
  const nextYear = d.getFullYear() + (nextMonth > 11 ? 1 : 0);
  const normalizedMonth = nextMonth % 12;
  return new Date(nextYear, normalizedMonth, 1, 0, 0, 0, 0);
}

/**
 * Format a given date as "DD/MM/YYYY" based on IST.
 */
function formatDateDDMMYYYY(date) {
  const d = toISTDate(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

module.exports = {
  startOfDayIST,
  startOfNextDayIST,
  startOfMonthIST,
  startOfNextMonthIST,
  formatDateDDMMYYYY,
};
