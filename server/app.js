import express from "express";
import cors from "cors";
// import helmet from "helmet"; // --- REMOVE HELMET ---
import rateLimit from "express-rate-limit";
import compression from "compression";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/database.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import logger from "./utils/logger.js";
import teacherRoutes from "./routes/teacher.js";
import hodRoutes from "./routes/hod.js";
import studentRoutes from "./routes/student.js";

import emailRoutes from './routes/email.js'; // Import email routes

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
connectDB();

const app = express();

/* ---------------- SECURITY & CORE MIDDLEWARE ---------------- */

// --- REMOVE HELMET COMPLETELY ---
// app.use(helmet());
// ---------------------------------

app.use(express.json({ limit: "50mb" })); // Increased limit
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased limit
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", limiter);

// GLOBAL PERMISSIVE CORS
app.use(
  cors({
    origin: "*", // Allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["*"], // Allow all headers
  }),
);

/* ---------------- STATIC FILES WITH PERMISSIVE CORS ---------------- */

app.use(
  "/uploads",
  (req, res, next) => {
    // Set extremely permissive headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.header("Access-Control-Allow-Headers", "*");

    // Explicitly disable Content Security Policy for static files if possible
    res.header("Cross-Origin-Resource-Policy", "cross-origin");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

// Add this before your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

/* ---------------- ROUTES ---------------- */
// ... (routes stay the same)
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/hod", hodRoutes);
app.use("/uploads/letters", express.static("uploads/letters"));

// Email routes
app.use('/api/email', emailRoutes);

// Add after your routes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

/* ---------------- FALLBACK & ERROR ---------------- */

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});

process.on("unhandledRejection", (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});
