// const mongoose = require("mongoose");
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Department", departmentSchema);
