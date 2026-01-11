"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendApprovalEmail = sendApprovalEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const logger_1 = require("../logger");
// Create reusable transporter
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.smtpHost,
    port: env_1.env.smtpPort,
    secure: false, // true for 465, false for other ports
    auth: {
        user: env_1.env.smtpUser,
        pass: env_1.env.smtpPassword,
    },
});
/**
 * Send email notification
 * @param to Recipient email address
 * @param subject Email subject
 * @param html Email HTML content
 * @param text Plain text content (optional)
 */
async function sendEmail(to, subject, html, text) {
    try {
        // Skip sending if email is not configured
        if (!env_1.env.smtpUser || !env_1.env.smtpPassword) {
            logger_1.logger.warn("Email not configured. Skipping email send.");
            return false;
        }
        const mailOptions = {
            from: env_1.env.smtpFrom,
            to: to,
            subject: subject,
            text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for plain text
            html: html,
        };
        const info = await transporter.sendMail(mailOptions);
        logger_1.logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Error sending email to ${to}: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}
/**
 * Send travel request approval email to employee
 * @param employeeEmail Employee's email address
 * @param employeeName Employee's name
 * @param travelRequest Travel request details
 */
async function sendApprovalEmail(employeeEmail, employeeName, travelRequest) {
    const startDate = new Date(travelRequest.startDate).toLocaleDateString();
    const endDate = new Date(travelRequest.endDate).toLocaleDateString();
    const subject = `Travel Request Approved: ${travelRequest.from} to ${travelRequest.to}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border: 1px solid #ddd;
          border-top: none;
        }
        .details {
          background-color: white;
          padding: 15px;
          margin: 15px 0;
          border-radius: 5px;
          border-left: 4px solid #4CAF50;
        }
        .detail-row {
          margin: 10px 0;
        }
        .label {
          font-weight: bold;
          color: #555;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #777;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Travel Request Approved</h1>
        </div>
        <div class="content">
          <p>Dear ${employeeName},</p>
          <p>Your travel request has been <strong>approved</strong> by your manager.</p>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">From:</span> ${travelRequest.from}
            </div>
            <div class="detail-row">
              <span class="label">To:</span> ${travelRequest.to}
            </div>
            <div class="detail-row">
              <span class="label">Travel Type:</span> ${travelRequest.travelType}
            </div>
            <div class="detail-row">
              <span class="label">Start Date:</span> ${startDate}
            </div>
            <div class="detail-row">
              <span class="label">End Date:</span> ${endDate}
            </div>
            <div class="detail-row">
              <span class="label">Purpose:</span> ${travelRequest.purpose}
            </div>
            ${travelRequest.managerComment ? `
            <div class="detail-row">
              <span class="label">Manager Comment:</span> ${travelRequest.managerComment}
            </div>
            ` : ''}
          </div>
          
          <p>Your travel request will now be processed by the travel desk team. You will receive further updates regarding your booking.</p>
          
          <p>Best regards,<br>Travel Desk Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
    return await sendEmail(employeeEmail, subject, html);
}
