import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory where email EJS templates are stored
const templatesDir = path.resolve(__dirname, '../templates/email');

/**
 * Generate a 6-digit numeric OTP
 */
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Render an EJS email template
 * @param {string} templateName - E.g. 'forgotPasswordOtp' or 'forgotPasswordOtp.ejs'
 * @param {object} data - Dynamic data passed to the EJS template
 * @returns {Promise<string>} Rendered HTML string
 */
export const renderEmailTemplate = async (templateName, data = {}) => {
  const fileName = templateName.endsWith('.ejs') ? templateName : `${templateName}.ejs`;
  const templatePath = path.join(templatesDir, fileName);

  return new Promise((resolve, reject) => {
    ejs.renderFile(templatePath, data, (err, str) => {
      if (err) {
        return reject(err);
      }
      resolve(str);
    });
  });
};

/**
 * Send an email with Nodemailer
 * @param {object} options - { to, subject, html, text, attachments }
 */
export const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  const mailHost = process.env.MAIL_HOST || 'smtp.gmail.com';
  const mailPort = parseInt(process.env.MAIL_PORT) || 587;
  const mailUser = process.env.USER_EMAIL || process.env.MAIL_USER;
  const mailPass = process.env.USER_PASS || process.env.MAIL_PASS;
  const senderEmail = process.env.SENDER_EMAIL || mailUser || 'noreply@balajiecommerce.com';
  const senderName = process.env.SENDER_NAME || 'Balaji E-Commerce';

  if (!mailUser || !mailPass) {
    console.log(`\n==================================================`);
    console.log(`📧 [EMAIL SIMULATION] SMTP credentials not set.`);
    console.log(`👉 Recipient : ${to}`);
    console.log(`📌 Subject   : ${subject}`);
    console.log(`==================================================\n`);
    return { success: true, simulated: true };
  }

  const isSecure = mailPort === 465;
  const transporter = nodemailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: isSecure,
    auth: {
      user: mailUser,
      pass: mailPass,
    },
  });

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to,
    subject,
    text,
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent successfully to ${to}:`, info.messageId);
  return { success: true, messageId: info.messageId };
};

/**
 * Send an email using an EJS template directly
 * @param {object} options - { to, subject, templateName, data, attachments }
 */
export const sendEmailWithTemplate = async ({ to, subject, templateName, data = {}, attachments = [] }) => {
  const html = await renderEmailTemplate(templateName, data);
  return sendEmail({ to, subject, html, attachments });
};

/**
 * Send OTP via Email using EJS template
 * @param {string} recipientEmail
 * @param {string} otp
 */
export const sendEmailOTP = async (recipientEmail, otp) => {
  const appName = process.env.SENDER_NAME || 'Balaji E-Commerce';
  const validMinutes = 5;

  let htmlContent = '';
  try {
    // Render from EJS template file: src/templates/email/forgotPasswordOtp.ejs
    htmlContent = await renderEmailTemplate('forgotPasswordOtp', {
      otp,
      recipientEmail,
      validMinutes,
      appName,
      year: new Date().getFullYear(),
    });
  } catch (templateError) {
    console.error('⚠️ Error rendering EJS template:', templateError.message);
    // Fallback minimal HTML
    htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>${appName} - OTP Verification</h2>
        <p>Your OTP code is: <strong style="font-size: 24px; color: #1a73e8;">${otp}</strong></p>
        <p>This code is valid for ${validMinutes} minutes.</p>
      </div>
    `;
  }

  const mailUser = process.env.USER_EMAIL || process.env.MAIL_USER;
  const mailPass = process.env.USER_PASS || process.env.MAIL_PASS;

  if (!mailUser || !mailPass) {
    console.log(`\n==================================================`);
    console.log(`📧 [EMAIL SIMULATION] SMTP credentials not set.`);
    console.log(`👉 Recipient : ${recipientEmail}`);
    console.log(`🔑 OTP Code  : ${otp}`);
    console.log(`⏳ Valid for : ${validMinutes} minutes`);
    console.log(`📄 Template  : src/templates/email/forgotPasswordOtp.ejs`);
    console.log(`==================================================\n`);
    return true;
  }

  try {
    await sendEmail({
      to: recipientEmail,
      subject: `Your Password Reset OTP - ${appName}`,
      text: `Your OTP for password reset is: ${otp}. It is valid for ${validMinutes} minutes.`,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email via SMTP to ${recipientEmail}:`, error.message);
    console.log(`\n👉 Fallback Dev OTP for ${recipientEmail}: ${otp}\n`);
    return true;
  }
};
