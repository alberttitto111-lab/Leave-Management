import express from 'express';
import nodemailer from 'nodemailer';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import LeaveRequest from '../models/LeaveRequest.js';

const router = express.Router();

// Simple test endpoint without authentication for debugging
router.post('/test-simple', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    console.log('📧 Test email endpoint called');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('EMAIL_USER from env:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('EMAIL_PASSWORD from env:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({
        success: false,
        message: 'Email credentials not configured in .env file'
      });
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    const mailOptions = {
      from: `"Leave Management System" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject || 'Test Email from Leave Management System',
      html: message || '<h1>Test Email</h1><p>If you receive this, email configuration is working!</p>'
    };
    
    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('❌ Email error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
      command: error.command
    });
  }
});

// Send notification email about leave request status
router.post('/notify-leave-status', protect, async (req, res) => {
  try {
    const { leaveId } = req.body;
    console.log('Notify leave status called for leave:', leaveId);
    
    // Fetch leave details with populated data
    const leave = await LeaveRequest.findById(leaveId)
      .populate('applicantId')
      .populate('leaveType');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Get student details
    const student = leave.applicantId;
    const studentEmail = student.personalInfo?.email;
    
    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Student email not found'
      });
    }

    console.log('Sending email to:', studentEmail);
    console.log('Leave status:', leave.finalStatus);

    // Format leave details
    const leaveDetails = {
      leaveType: leave.leaveType?.name || 'N/A',
      days: leave.dateRange?.days || 0,
      fromDate: new Date(leave.dateRange?.from).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      toDate: new Date(leave.dateRange?.to).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      reason: leave.reason || 'N/A'
    };

    // Get student name
    const studentName = `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim() || 'Student';

    // Create email content based on status
    let htmlContent;
    let subject;

    if (leave.finalStatus === 'approved') {
      subject = `✅ Leave Request Approved - #${leave.requestId}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .details { background: white; padding: 15px; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Leave Request Approved ✅</h1>
            </div>
            <div class="content">
              <h2>Dear ${studentName},</h2>
              <p>Your leave request has been <strong>APPROVED</strong>.</p>
              
              <div class="details">
                <h3>Leave Details:</h3>
                <p><strong>Request ID:</strong> #${leave.requestId}</p>
                <p><strong>Leave Type:</strong> ${leaveDetails.leaveType}</p>
                <p><strong>Duration:</strong> ${leaveDetails.days} day(s)</p>
                <p><strong>From:</strong> ${leaveDetails.fromDate}</p>
                <p><strong>To:</strong> ${leaveDetails.toDate}</p>
                <p><strong>Reason:</strong> ${leaveDetails.reason}</p>
              </div>
              
              <p>You can view the complete details in the Leave Management System.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from the Leave Management System.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (leave.finalStatus === 'rejected') {
      // Find rejection reason from approvals
      const rejection = leave.approvals?.find(a => a.status === 'rejected');
      const rejectionReason = rejection?.remarks || leave.rejectionReason || 'No specific reason provided';
      
      subject = `❌ Leave Request Rejected - #${leave.requestId}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .details { background: white; padding: 15px; border-radius: 5px; }
            .rejection { background: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Leave Request Rejected ❌</h1>
            </div>
            <div class="content">
              <h2>Dear ${studentName},</h2>
              <p>Your leave request has been <strong>REJECTED</strong>.</p>
              
              <div class="details">
                <h3>Leave Details:</h3>
                <p><strong>Request ID:</strong> #${leave.requestId}</p>
                <p><strong>Leave Type:</strong> ${leaveDetails.leaveType}</p>
                <p><strong>Duration:</strong> ${leaveDetails.days} day(s)</p>
                <p><strong>From:</strong> ${leaveDetails.fromDate}</p>
                <p><strong>To:</strong> ${leaveDetails.toDate}</p>
                <p><strong>Your Reason:</strong> ${leaveDetails.reason}</p>
              </div>
              
              <div class="rejection">
                <h3>⚠️ Reason for Rejection:</h3>
                <p>${rejectionReason}</p>
              </div>
              
              <p>You can submit a new leave request with additional information if needed.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from the Leave Management System.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Leave request is not finalized (neither approved nor rejected)'
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: `"Leave Management System" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: subject,
      html: htmlContent
    };

    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);

    res.json({
      success: true,
      message: `Notification email sent successfully to ${studentEmail}`,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Error sending notification email:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Email route is working'
  });
});

export default router;