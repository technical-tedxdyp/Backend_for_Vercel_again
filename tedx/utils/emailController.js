// File: functions/utils/email.js
const nodemailer = require('nodemailer');
const path = require('path');
const functions = require('firebase-functions');

// Load .env for local development only
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Get email credentials from env or Firebase config
const emailUser = process.env.TEDX_EMAIL_USER || (functions.config().email && functions.config().email.user);
const emailPass = process.env.TEDX_EMAIL_PASS || (functions.config().email && functions.config().email.pass);

if (!emailUser || !emailPass) {
  console.warn(
    '⚠️ Email credentials are missing. ' +
    'Set them with: firebase functions:config:set email.user="your_email" email.pass="your_password"'
  );
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

/**
 * Send an email with optional attachment
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 * @param {string} [attachmentPath] - Path to attachment (optional)
 */
exports.sendEmail = async (to, subject, html, attachmentPath) => {
  try {
    const mailOptions = {
      from: emailUser,
      to,
      subject,
      html,
      attachments: attachmentPath
        ? [
            {
              filename: path.basename(attachmentPath),
              path: attachmentPath,
            },
          ]
        : [],
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully');
  } catch (err) {
    console.error('❌ Error sending email:', err);
    throw new Error('Failed to send email');
  }
};
