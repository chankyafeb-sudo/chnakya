// routes/bookRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const apiLimiter = require("../middleware/rateLimiter");

// Controllers
const { getBooksByClassId } = require("../controllers/student/bookController");
const { postBookByClassId } = require("../controllers/staff/bookController");

// Multer (memory) for Cloudinary uploads
const upload = require("../utils/multerCloudinary");

router.use(apiLimiter);
router.use(authMiddleware);

// GET all books for a class (student)
router.get("/class/:classid", getBooksByClassId);

// POST new book for a class (staff) — multipart (book_file )
router.post("/staff/:classid", upload.single("book_file"), postBookByClassId);

module.exports = router;
