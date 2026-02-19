// server/scripts/migrateDepartmentData.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Department from "../models/Department.js";

dotenv.config();

const migrateDepartmentData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all students with departmentId that might be just strings
    const students = await User.find({ 
      role: "student",
      departmentId: { $exists: true, $ne: null }
    });

    console.log(`Found ${students.length} students with departmentId`);

    for (const student of students) {
      // Check if departmentId is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(student.departmentId)) {
        // Check if department exists
        const department = await Department.findById(student.departmentId);
        if (department) {
          console.log(`Student ${student.userId} has valid department: ${department.name}`);
        } else {
          console.log(`Student ${student.userId} has invalid department ID: ${student.departmentId}`);
        }
      } else {
        console.log(`Student ${student.userId} has non-ObjectId departmentId: ${student.departmentId}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
};

migrateDepartmentData();