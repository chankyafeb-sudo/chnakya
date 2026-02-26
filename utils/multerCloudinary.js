// utils/multerCloudinary.js (RELAXED - safer)
const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const allowedMimePrefixes = ["image/"];
const allowedMimeExact = [
  "application/pdf",
  "application/octet-stream",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/epub+zip",
  "text/plain",
];

const allowedExts = [
  "jpg",
  "jpeg",
  "png",
  "pdf",
  "doc",
  "docx",
  "epub",
  "txt",
  "png",
  "heic",
  "webp",
]; // extend if needed

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB if you want bigger
  fileFilter: (req, file, cb) => {
    const mimetype = file.mimetype || "";
    const ext = (path.extname(file.originalname) || "")
      .replace(".", "")
      .toLowerCase();

    // Accept if mimetype starts with allowed image prefix
    if (allowedMimePrefixes.some((p) => mimetype.startsWith(p)))
      return cb(null, true);

    // Accept if mimetype is one of exact allowed types
    if (allowedMimeExact.includes(mimetype)) return cb(null, true);

    // Fallback: accept by file extension if it matches list
    if (ext && allowedExts.includes(ext)) return cb(null, true);

    // Otherwise reject but log info to help debugging
    console.warn("Rejected file upload - mimetype / ext not allowed:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype,
      ext,
    });
    return cb(
      new Error("Invalid file type (allowed: images, pdf, docs, epub, txt)")
    );
  },
});

module.exports = upload;
