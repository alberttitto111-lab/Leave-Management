// seedLeaveTypes.js
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import LeaveType from "../models/LeaveType.js";

const leaveTypes = [
  {
    name: "Sick Leave",
    code: "SL",
    color: "#EF4444",
    maxDaysPerYear: 15,
    maxDaysPerMonth: 3,
    requiresDocument: false,
    applicableTo: ["student", "staff"],
    approvalHierarchy: [
      { role: "teacher", level: 1 },
      { role: "hod", level: 2 },
    ],
    isPaid: false,
    carryForward: false,
    isActive: true,
  },
  {
    name: "Casual Leave",
    code: "CL",
    color: "#3B82F6",
    maxDaysPerYear: 10,
    maxDaysPerMonth: 2,
    requiresDocument: false,
    applicableTo: ["student", "staff"],
    approvalHierarchy: [{ role: "teacher", level: 1 }],
    isPaid: false,
    carryForward: false,
    isActive: true,
  },
  {
    name: "Medical Leave",
    code: "ML",
    color: "#10B981",
    maxDaysPerYear: 30,
    maxDaysPerMonth: 5,
    requiresDocument: true,
    applicableTo: ["student", "staff"],
    approvalHierarchy: [
      { role: "teacher", level: 1 },
      { role: "hod", level: 2 },
      { role: "admin", level: 3 },
    ],
    isPaid: false,
    carryForward: false,
    isActive: true,
  },
  {
    name: "Exam Leave",
    code: "EL",
    color: "#F59E0B",
    maxDaysPerYear: 0, // unlimited or exam specific
    maxDaysPerMonth: 0,
    requiresDocument: true,
    applicableTo: ["student"],
    approvalHierarchy: [
      { role: "teacher", level: 1 },
      { role: "hod", level: 2 },
    ],
    isPaid: false,
    carryForward: false,
    isActive: true,
  },
  {
    name: "Family Emergency",
    code: "FE",
    color: "#8B5CF6",
    maxDaysPerYear: 5,
    maxDaysPerMonth: 2,
    requiresDocument: false,
    applicableTo: ["all"],
    approvalHierarchy: [
      { role: "teacher", level: 1 },
      { role: "hod", level: 2 },
    ],
    isPaid: false,
    carryForward: false,
    isActive: true,
  },
  {
    name: "Sports/Co-curricular",
    code: "SC",
    color: "#EC4899",
    maxDaysPerYear: 10,
    maxDaysPerMonth: 3,
    requiresDocument: true,
    applicableTo: ["student"],
    approvalHierarchy: [
      { role: "teacher", level: 1 },
      { role: "hod", level: 2 },
    ],
    isPaid: false,
    carryForward: false,
    isActive: true,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing leave types
    await LeaveType.deleteMany({});
    console.log("Cleared existing leave types");

    // Insert new leave types
    const result = await LeaveType.insertMany(leaveTypes);
    console.log(`Inserted ${result.length} leave types`);

    console.log("Leave types created:");
    result.forEach((type) => {
      console.log(
        `- ${type.name} (${type.code}): ${type.applicableTo.join(", ")}`,
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
