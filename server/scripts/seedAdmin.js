import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const seedAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("Connected to MongoDB for seeding...");

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      logger.info("Admin user already exists:");
      console.log(`  UserID: ${existingAdmin.userId}`);
      console.log(`  Email: ${existingAdmin.personalInfo.email}`);
      console.log(
        `  Status: ${existingAdmin.isActive ? "Active" : "Inactive"}`,
      );
      process.exit(0);
    }

    const admin = await User.create({
      userId: "ADM0001",
      password: "admin123",
      role: "admin",
      isFirstLogin: true,
      personalInfo: {
        firstName: "System",
        lastName: "Administrator",
        email: "admin@system.com",
        phone: "0000000000",
      },
    });

    logger.info("========================================");
    logger.info("Admin user created successfully!");
    console.log("  Login ID: admin  (or ADM0001)");
    console.log("  Password: admin123");
    console.log("  Note: Must change password on first login");
    logger.info("========================================");

    process.exit(0);
  } catch (error) {
    logger.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
