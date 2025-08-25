const express = require('express');
const router = express.Router();
const { createOrder } = require('../utils/razorpayUtils');
const Ticket = require('../models/Ticket');
const Counter = require('../models/Counter');
const crypto = require('crypto');
const { generateTicket } = require('../utils/pdfGenerator');
const { sendTicketEmail } = require('../utils/email');
const appendRowToSheet = require('../utils/googleSheetsService');
const connectDB = require('../utils/db');
const { bookTicket } = require('../utils/sessionBookingController'); // Import booking logic

const RAZORPAY_KEY_SECRET = process.env.TEDX_RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_SECRET) {
  console.warn('⚠️ RAZORPAY_KEY_SECRET is missing. Set it in .env or Vercel environment variables.');
}

connectDB().catch(err => console.error("MongoDB connection error on startup:", err));

const getNextSequenceValue = async (sequenceName) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
};

// Create Razorpay Order
router.post('/create-order', async (req, res) => {
  const { amount } = req.body;
  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }
  try {
    const order = await createOrder(amount * 100);
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify Payment & Store Ticket with booking check
router.post('/verify-payment', async (req, res) => {
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

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !name ||
    !email ||
    !phone ||
    !session ||
    !amount
  ) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Attempt to book ticket (availability check + increment)
    await bookTicket(session, { name, email, phone, department, branch, amount });

    const ticketNumber = await getNextSequenceValue('ticketId');
    const ticketId = `TEDX-${String(ticketNumber).padStart(5, '0')}`;

    const ticket = await Ticket.create({
      ticketId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      name,
      email,
      phone,
      department: department || '',
      branch: branch || '',
      session,
      amount
    });

    const pdfBuffer = await generateTicket({
      name,
      email,
      phone,
      department,
      branch,
      session,
      amount,
      razorpayPaymentId: razorpay_payment_id,
      ticketId
    });

    await sendTicketEmail({
      to: email,
      name,
      ticketId,
      session,
      amount,
      pdfBuffer
    });

    await appendRowToSheet([
      ticket.name,
      ticket.email,
      ticket.phone,
      ticket.department,
      ticket.branch,
      ticket.session,
      ticket.amount,
      ticket.razorpayOrderId,
      ticket.razorpayPaymentId,
      ticket.ticketId,
      new Date(ticket.createdAt).toLocaleString()
    ]);

    res.json({
      success: true,
      message: 'Payment verified, ticket stored, and email sent successfully',
      ticketId: ticket.ticketId
    });

  } catch (err) {
    console.error('Error during payment verification or booking:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to verify payment or book ticket' });
  }
});

module.exports = router;
