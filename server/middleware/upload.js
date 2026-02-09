import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage (local files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // --- UPDATED: Allowed MIME types ---
    const allowedMimeTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      // Documents
      "application/pdf", // PDF
      "application/msword", // DOC
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "application/vnd.ms-excel", // XLS
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
      "text/csv", // CSV
      "text/plain", // TXT
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(
        new Error(
          "File type not allowed. Please upload images, PDFs, or office documents.",
        ),
        false,
      );
    } else {
      cb(null, true);
    }
  },
});

export default upload;
