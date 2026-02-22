// server/utils/emailService.js
import nodemailer from 'nodemailer';

// Create transporter with better configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Helps with self-signed certificate issues
  },
  debug: true, // Enable debug logs
  logger: true // Log information
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('Transporter verification error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

// Email templates
export const emailTemplates = {
  approved: (studentName, leaveDetails, requestId) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f6f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 3px;
        }
        .content {
          background-color: white;
          border-radius: 18px;
          padding: 40px 30px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo span {
          font-size: 40px;
          color: white;
        }
        .badge {
          display: inline-block;
          padding: 10px 25px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          font-weight: bold;
          border-radius: 30px;
          font-size: 18px;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }
        .title {
          color: #333;
          font-size: 28px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .subtitle {
          color: #666;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .details-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
          border-left: 5px solid #28a745;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #495057;
          font-weight: 600;
          font-size: 15px;
        }
        .detail-value {
          color: #28a745;
          font-weight: 700;
          font-size: 15px;
        }
        .message {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
          border-left: 5px solid #2196f3;
          font-style: italic;
          color: #333;
          line-height: 1.6;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e9ecef;
          color: #868e96;
          font-size: 14px;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <div class="header">
            <div class="logo">
              <span>✓</span>
            </div>
            <div class="badge">✅ APPROVED</div>
            <h1 class="title">Congratulations, ${studentName}!</h1>
            <p class="subtitle">Your leave request has been approved</p>
          </div>

          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Request ID:</span>
              <span class="detail-value">#${requestId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Leave Type:</span>
              <span class="detail-value">${leaveDetails.leaveType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">${leaveDetails.days} day(s)</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">From:</span>
              <span class="detail-value">${leaveDetails.fromDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">To:</span>
              <span class="detail-value">${leaveDetails.toDate}</span>
            </div>
          </div>

          <div class="message">
            <strong>📝 Reason:</strong> ${leaveDetails.reason}
          </div>

          <div class="footer">
            <p>This is an automated message from the Leave Management System.</p>
            <p>© 2026 Leave Management System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,

  rejected: (studentName, leaveDetails, requestId, reason) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f6f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          border-radius: 20px;
          padding: 3px;
        }
        .content {
          background-color: white;
          border-radius: 18px;
          padding: 40px 30px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo span {
          font-size: 40px;
          color: white;
        }
        .badge {
          display: inline-block;
          padding: 10px 25px;
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          color: white;
          font-weight: bold;
          border-radius: 30px;
          font-size: 18px;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
        }
        .title {
          color: #333;
          font-size: 28px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .subtitle {
          color: #666;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .details-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
          border-left: 5px solid #dc3545;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #495057;
          font-weight: 600;
          font-size: 15px;
        }
        .detail-value {
          color: #dc3545;
          font-weight: 700;
          font-size: 15px;
        }
        .rejection-box {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
          border-left: 5px solid #dc3545;
        }
        .rejection-title {
          color: #dc3545;
          font-weight: 700;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .rejection-text {
          color: #721c24;
          line-height: 1.6;
          font-style: italic;
        }
        .message {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
          border-left: 5px solid #2196f3;
          font-style: italic;
          color: #333;
          line-height: 1.6;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e9ecef;
          color: #868e96;
          font-size: 14px;
        }
        .footer a {
          color: #dc3545;
          text-decoration: none;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <div class="header">
            <div class="logo">
              <span>✗</span>
            </div>
            <div class="badge">❌ REJECTED</div>
            <h1 class="title">Dear ${studentName},</h1>
            <p class="subtitle">Your leave request has been reviewed</p>
          </div>

          <div class="details-card">
            <div class="detail-row">
              <span class="detail-label">Request ID:</span>
              <span class="detail-value">#${requestId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Leave Type:</span>
              <span class="detail-value">${leaveDetails.leaveType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">${leaveDetails.days} day(s)</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">From:</span>
              <span class="detail-value">${leaveDetails.fromDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">To:</span>
              <span class="detail-value">${leaveDetails.toDate}</span>
            </div>
          </div>

          <div class="rejection-box">
            <div class="rejection-title">⚠️ Reason for Rejection</div>
            <div class="rejection-text">"${reason}"</div>
          </div>

          <div class="message">
            <strong>📝 Your Reason:</strong> ${leaveDetails.reason}
          </div>

          <div class="footer">
            <p>This is an automated message from the Leave Management System.</p>
            <p>© 2026 Leave Management System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
};

export const sendEmailNotification = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"Leave Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};