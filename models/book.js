// models/book.js
const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    bookname: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    subject: { type: String, trim: true, default: "" },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    book_url: { type: String, trim: true }, // primary file (pdf/image)
    cover_url: { type: String, trim: true }, // optional cover image
    attachments: [{ type: String, trim: true }], // optional extra files (URLs)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
