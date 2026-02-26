// controllers/staff/bookController.js
const mongoose = require("mongoose");
const Book = require("../../models/book");
const ClassModel = require("../../models/class");
const { uploadBuffer } = require("../../utils/cloudinary");

// Upload buffer -> Cloudinary
const uploadBufferToCloudinary = async (buffer, folder = "class_books") => {
  if (!buffer) return null;
  const publicId = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const res = await uploadBuffer(buffer, {
    folder,
    public_id: publicId,
    resource_type: "auto",
  });
  return res?.secure_url || res?.url || null;
};

// Upload base64/dataURL -> Cloudinary
const uploadBase64ToCloudinary = async (base64OrDataUrl, folder = "class_books") => {
  if (!base64OrDataUrl) return null;
  const matched = String(base64OrDataUrl).match(/^data:(.+);base64,(.+)$/);
  const base64 = matched ? matched[2] : base64OrDataUrl;
  const buffer = Buffer.from(base64, "base64");
  return await uploadBufferToCloudinary(buffer, folder);
};

// Main controller
const postBookByClassId = async (req, res) => {
  try {
    const classId = req.params.classid || req.params.class_id || req.params.id;
    console.log("[postBookByClassId] params:", req.params);
    console.log("[postBookByClassId] body keys:", Object.keys(req.body || {}));

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ error: "Invalid class id" });
    }
    const classObjectId = new mongoose.Types.ObjectId(classId);

    const classDoc = await ClassModel.findById(classObjectId)
      .select("_id class_name books")
      .lean()
      .exec();
    if (!classDoc) return res.status(404).json({ error: "Class not found" });

    const { bookname, description = "", subject = "" } = req.body || {};
    if (!bookname || typeof bookname !== "string" || !bookname.trim()) {
      return res.status(400).json({ error: "bookname is required" });
    }

    const payload = {
      bookname: String(bookname).trim(),
      description: description ? String(description).trim() : "",
      subject: subject ? String(subject).trim() : "",
      class_id: classObjectId,
    };

    // File handling (Cloudinary only)
    let bookUrl = null;
    const fileObj = req.file || null; // multer.single -> req.file

    if (fileObj && fileObj.buffer) {
      try {
        bookUrl = await uploadBufferToCloudinary(fileObj.buffer, "class_books");
        console.log("[postBookByClassId] uploaded book_file ->", bookUrl);
      } catch (e) {
        console.error("[postBookByClassId] book file upload failed:", e);
        return res.status(500).json({ error: "Failed to upload book file to Cloudinary" });
      }
    }

    // base64 fallback (Cloudinary)
    if (!bookUrl && (req.body.book_file_base64 || req.body.book_base64)) {
      try {
        bookUrl = await uploadBase64ToCloudinary(
          req.body.book_file_base64 ?? req.body.book_base64,
          "class_books"
        );
        console.log("[postBookByClassId] uploaded book_base64 ->", bookUrl);
      } catch (e) {
        console.error("[postBookByClassId] book base64 upload failed:", e);
        return res.status(500).json({ error: "Failed to upload book base64 to Cloudinary" });
      }
    }

    if (bookUrl) payload.book_url = bookUrl;

    const createdBook = await Book.create(payload);
    console.log("[postBookByClassId] createdBook:", createdBook._id);

    await ClassModel.findByIdAndUpdate(
      classObjectId,
      { $addToSet: { books: createdBook._id } },
      { new: true }
    ).exec();

    return res.status(201).json({
      message: "Book created and associated with class (uploaded to Cloudinary)",
      book: {
        id: String(createdBook._id),
        bookname: createdBook.bookname,
        subject: createdBook.subject,
        book_url: createdBook.book_url || null,
        uploaded_to: "cloudinary",
      },
    });
  } catch (err) {
    console.error("[postBookByClassId] error:", err && (err.stack || err));
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { postBookByClassId };
