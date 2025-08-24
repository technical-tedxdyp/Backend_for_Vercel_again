// File: functions/controllers/paymentController.js
const functions = require('firebase-functions');
const crypto = require('crypto');
const { createOrder } = require('./razorpay');
const Ticket = require('../models/Ticket');
const { generateTicket } = require('./pdfGenerator');
const { sendEmail } = require('./email');

// Load .env for local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Get Razorpay secret from env or Firebase config
const RAZORPAY_KEY_SECRET =
  process.env.TEDX_RAZORPAY_KEY_SECRET ||
  (functions.config().razorpay && functions.config().razorpay.key_secret);

if (!RAZORPAY_KEY_SECRET) {
  console.warn(
    '⚠️ RAZORPAY_KEY_SECRET is missing. ' +
    'Set it locally in .env or in Firebase with:\n' +
    'firebase functions:config:set razorpay.key_secret="your_secret"'
  );
}

exports.createPaymentOrder = async (req, res) => {
  try {
    // Get payment details (add department and branch)
    const { name, email, phone, department, branch, session, amount } = req.body;

    if (!name || !email || !phone || !session || !amount) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const order = await createOrder(amount);
    res.json({ id: order.id, amount: order.amount });
  } catch (err) {
    console.error('❌ Error creating payment order:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      email,
      phone,
      department,
      branch,
      session,
      amount
    } = req.body;

    // Verify Razorpay Signature
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Save ticket in DB, including department and branch
    const ticket = new Ticket({
      name,
      email,
      phone,
      department,
      branch,
      session,
      amount,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });
    await ticket.save();

    // Generate PDF ticket and send email
    const filePath = await generateTicket(ticket.toObject());
    await sendEmail(
      email,
      "Your TEDx DYP Akurdi Ticket",
      "Please find your ticket attached.",
      filePath
    );

    res.json({
      success: true,
      message: "Payment verified and ticket sent to email",
      ticketId: ticket._id.toString(),
    });
  } catch (err) {
    console.error('❌ Error in payment verification:', err);
    res.status(500).json({ error: err.message });
  }
};
