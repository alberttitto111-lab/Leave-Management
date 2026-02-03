import crypto from "crypto";

export const generateLeaveRequestId = async (model) => {
  const year = new Date().getFullYear();
  const prefix = `LEAVE-${year}`;

  const lastRequest = await model
    .findOne({
      requestId: new RegExp(`^${prefix}`),
    })
    .sort({ requestId: -1 });

  let sequence = 1;
  if (lastRequest) {
    const lastSequence = parseInt(lastRequest.requestId.split("-")[2]);
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(6, "0")}`;
};

export const generateShortId = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

export const generateTimestampId = () => {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `TS-${timestamp}-${random}`;
};

export const generateBatchId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `BATCH-${date}-${random}`;
};

export const generateDepartmentCode = (name) => {
  const words = name.split(" ");
  if (words.length === 1) {
    return name.substring(0, 3).toUpperCase();
  }
  return words
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

export const generateRollNumber = async (model, className, section, year) => {
  const prefix = `${className}-${section}-${year}`;

  const lastStudent = await model
    .findOne({
      "academicInfo.rollNumber": new RegExp(`^${prefix}`),
    })
    .sort({ "academicInfo.rollNumber": -1 });

  let sequence = 1;
  if (lastStudent) {
    const lastSeq = parseInt(lastStudent.academicInfo.rollNumber.split("-")[3]);
    sequence = lastSeq + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
};

export const generateFileName = (
  originalName,
  userId,
  folder = "documents",
) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  const ext = originalName.split(".").pop();
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, "_");

  return `${folder}/${sanitizedUserId}-${timestamp}-${random}.${ext}`;
};

export const generateNotificationId = () => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `NOTIF-${timestamp}-${random}`;
};

export const generateSessionId = () => {
  return crypto.randomBytes(16).toString("base64url");
};

export const parseLeaveRequestId = (requestId) => {
  const pattern = /^LEAVE-(\d{4})-(\d{6})$/;
  const match = requestId.match(pattern);

  if (!match) return null;

  return {
    year: parseInt(match[1]),
    sequence: parseInt(match[2]),
    isValid: true,
  };
};

export const generateBulkIds = async (model, count, type = "leave") => {
  const ids = [];

  for (let i = 0; i < count; i++) {
    if (type === "leave") {
      const id = await generateLeaveRequestId(model);
      ids.push(id);
    }
  }

  return ids;
};

export default {
  generateLeaveRequestId,
  generateShortId,
  generateSecureToken,
  generateTimestampId,
  generateBatchId,
  generateDepartmentCode,
  generateRollNumber,
  generateFileName,
  generateNotificationId,
  generateSessionId,
  parseLeaveRequestId,
  generateBulkIds,
};
