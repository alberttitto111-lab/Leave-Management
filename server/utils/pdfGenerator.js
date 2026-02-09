import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateApprovalLetter = async (leaveRequest, approver) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const fileName = `approval_${leaveRequest.requestId}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../uploads/letters", fileName);

      // Ensure directory exists
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc
        .fontSize(25)
        .text("LEAVE APPROVAL LETTER", 50, 50, { align: "center" });
      doc.moveDown();

      // Reference Number
      doc.fontSize(12).text(`Ref No: ${leaveRequest.requestId}`, 50, 100);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 400, 100);
      doc.moveDown(2);

      // Content
      doc.fontSize(14).text("To Whom It May Concern:", 50, 140);
      doc.moveDown();

      const studentName =
        leaveRequest.applicantId?.personalInfo?.firstName +
        " " +
        leaveRequest.applicantId?.personalInfo?.lastName;

      doc
        .fontSize(12)
        .text(
          `This is to certify that ${studentName} (Roll No: ${leaveRequest.applicantId?.userId}) ` +
            `has been granted leave from ${new Date(leaveRequest.dateRange.from).toLocaleDateString()} ` +
            `to ${new Date(leaveRequest.dateRange.to).toLocaleDateString()} ` +
            `(${leaveRequest.dateRange.days} days) for the reason: ${leaveRequest.reason}.`,
          50,
          180,
          { width: 500, align: "justify" },
        );
      doc.moveDown(2);

      // Approval Details
      doc.text(
        `Approved by: ${approver.personalInfo?.firstName} ${approver.personalInfo?.lastName}`,
        50,
      );
      doc.text(
        `Designation: ${approver.role === "hod" ? "Head of Department" : "Class Teacher"}`,
        50,
      );
      doc.text(`Department: ${approver.departmentId?.name || "N/A"}`, 50);
      doc.moveDown(2);

      // Signature line
      doc.text("_____________________", 50);
      doc.text("Authorized Signature", 50);

      doc.end();

      stream.on("finish", () => {
        resolve({
          url: `/uploads/letters/${fileName}`,
          path: filePath,
        });
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
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
      const doc = new PDFDocument();
      const fileName = `rejection_${leaveRequest.requestId}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../uploads/letters", fileName);

      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc
        .fontSize(25)
        .text("LEAVE REQUEST REJECTION", 50, 50, { align: "center" });
      doc.moveDown();

      // Reference
      doc.fontSize(12).text(`Ref No: ${leaveRequest.requestId}`, 50, 100);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 400, 100);
      doc.moveDown(2);

      // Content
      doc.fontSize(14).text("To Whom It May Concern:", 50, 140);
      doc.moveDown();

      const studentName =
        leaveRequest.applicantId?.personalInfo?.firstName +
        " " +
        leaveRequest.applicantId?.personalInfo?.lastName;

      doc
        .fontSize(12)
        .text(
          `We regret to inform you that the leave request submitted by ${studentName} ` +
            `(Roll No: ${leaveRequest.applicantId?.userId}) for the period ` +
            `${new Date(leaveRequest.dateRange.from).toLocaleDateString()} to ` +
            `${new Date(leaveRequest.dateRange.to).toLocaleDateString()} has been rejected.`,
          50,
          180,
          { width: 500, align: "justify" },
        );
      doc.moveDown();

      doc.text(`Reason for Rejection: ${rejectionReason}`, 50);
      doc.moveDown(2);

      // Approver Details
      doc.text(
        `Rejected by: ${approver.personalInfo?.firstName} ${approver.personalInfo?.lastName}`,
        50,
      );
      doc.text(
        `Designation: ${approver.role === "hod" ? "Head of Department" : "Class Teacher"}`,
        50,
      );
      doc.moveDown(2);

      doc.text("_____________________", 50);
      doc.text("Authorized Signature", 50);

      doc.end();

      stream.on("finish", () => {
        resolve({
          url: `/uploads/letters/${fileName}`,
          path: filePath,
        });
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};
