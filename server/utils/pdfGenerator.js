import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureDir = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getStudentName = (leaveRequest) => {
  const p = leaveRequest.applicantId?.personalInfo || {};
  return `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Student";
};

export const generateApprovalLetter = async (leaveRequest, approver) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 60 });

      const fileName = `approval_${leaveRequest.requestId}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../uploads/letters", fileName);

      ensureDir(filePath);

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      /* ---------- HEADER ---------- */

      doc.fontSize(22).text("LEAVE APPROVAL LETTER", {
        align: "center",
      });

      doc.moveDown();

      doc.fontSize(12);
      doc.text(`Ref No: ${leaveRequest.requestId}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);

      doc.moveDown(2);

      /* ---------- BODY ---------- */

      const studentName = getStudentName(leaveRequest);

      doc.fontSize(12).text("To Whom It May Concern:");
      doc.moveDown();

      doc.text(
        `This is to certify that ${studentName} (Roll No: ${
          leaveRequest.applicantId?.userId || "N/A"
        }) has been granted leave from ${new Date(
          leaveRequest.dateRange.from,
        ).toLocaleDateString()} to ${new Date(
          leaveRequest.dateRange.to,
        ).toLocaleDateString()} (${leaveRequest.dateRange.days} days).

Reason: ${leaveRequest.reason}`,
        { align: "justify" },
      );

      doc.moveDown(2);

      /* ---------- APPROVER ---------- */

      const ap = approver.personalInfo || {};

      doc.text(
        `Approved by: ${ap.firstName || ""} ${ap.lastName || ""}`.trim(),
      );
      doc.text(
        `Designation: ${
          approver.role === "hod" ? "Head of Department" : "Class Teacher"
        }`,
      );
      doc.text(`Department: ${approver.departmentId?.name || "N/A"}`);

      doc.moveDown(3);

      doc.text("________________________");
      doc.text("Authorized Signature");

      doc.end();

      stream.on("finish", () =>
        resolve({
          url: `/uploads/letters/${fileName}`,
          path: filePath,
        }),
      );

      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};

export const generateRejectionLetter = async (
  leaveRequest,
  approver,
  rejectionReason,
) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 60 });

      const fileName = `rejection_${leaveRequest.requestId}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../uploads/letters", fileName);

      ensureDir(filePath);

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(22).text("LEAVE REQUEST REJECTED", {
        align: "center",
      });

      doc.moveDown();

      doc.text(`Ref No: ${leaveRequest.requestId}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);

      doc.moveDown(2);

      const studentName = getStudentName(leaveRequest);

      doc.text(
        `The leave request submitted by ${studentName} (Roll No: ${
          leaveRequest.applicantId?.userId || "N/A"
        }) for the period ${new Date(
          leaveRequest.dateRange.from,
        ).toLocaleDateString()} to ${new Date(
          leaveRequest.dateRange.to,
        ).toLocaleDateString()} has been rejected.

Reason: ${rejectionReason}`,
        { align: "justify" },
      );

      doc.moveDown(2);

      const ap = approver.personalInfo || {};

      doc.text(
        `Rejected by: ${ap.firstName || ""} ${ap.lastName || ""}`.trim(),
      );

      doc.moveDown(3);

      doc.text("________________________");
      doc.text("Authorized Signature");

      doc.end();

      stream.on("finish", () =>
        resolve({
          url: `/uploads/letters/${fileName}`,
          path: filePath,
        }),
      );

      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};
