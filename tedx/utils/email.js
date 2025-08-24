// File: functions/utils/email.js

const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.TEDX_EMAIL_USER;
const EMAIL_PASS = process.env.TEDX_EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error configuring email transporter:', error);
  } else {
    console.log('Email transporter is ready');
  }
});

const sendTicketEmail = async (ticketData) => {
  try {
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error('Email credentials are not set in environment variables');
    }

    const mailOptions = {
      from: `"TEDx DYP Akurdi" <${EMAIL_USER}>`,
      to: ticketData.email || ticketData.to,
      subject: 'Your TEDx Ticket & Welcome!',
      html: `
        <h2>Welcome to TEDx DYP Akurdi!</h2>
        <p>Dear <strong>${ticketData.name}</strong>,</p>
        <p>Thank you for registering for our event. Your ticket is attached as a PDF.</p>
        <ul>
          <li><strong>Ticket ID:</strong> ${ticketData.ticketId || ''}</li>
          <li><strong>Session:</strong> ${ticketData.session}</li>
          <li><strong>Amount Paid:</strong> ₹${ticketData.amount}</li>
          <li><strong>Payment ID:</strong> ${ticketData.razorpayPaymentId || ''}</li>
        </ul>
        <p>We look forward to welcoming you!</p>
        <p>Best regards,<br/>TEDx DYP Akurdi Team</p>
      `,
      attachments: [
        {
          filename: `TEDx-Ticket-${ticketData.ticketId}.pdf`,
          content: ticketData.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Ticket email sent to ${mailOptions.to}`);
  } catch (err) {
    console.error('❌ Error sending ticket email:', err);
    throw new Error('Failed to send email.');
  }
};

module.exports = { sendTicketEmail };
