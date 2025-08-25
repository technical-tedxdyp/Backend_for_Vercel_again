const crypto = require('crypto');
const { createOrder } = require('./razorpay');
const Ticket = require('../models/Ticket');
const { generateTicket } = require('./pdfGenerator');
const { sendEmail } = require('./email');
const { bookTicket } = require('./sessionBookingController');

// Load .env for local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const RAZORPAY_KEY_SECRET = process.env.TEDX_RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_SECRET) {
  console.warn(
    '⚠️ RAZORPAY_KEY_SECRET is missing. ' +
    'Set it in .env or your Vercel environment variables.'
  );
}

exports.createPaymentOrder = async (req, res) => {
  try {
    const { name, email, phone, department, branch, session, amount } = req.body;

    if (!name || !email || !phone || !session || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
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

    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Book ticket availability and update counters
    await bookTicket(session, { name, email, phone, department, branch, amount });

    // Save the ticket in DB
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
      'Your TEDx DYP Akurdi Ticket',
      'Please find your ticket attached.',
      filePath
    );

    res.json({
      success: true,
      message: 'Payment verified and ticket sent to email',
      ticketId: ticket._id.toString(),
    });
  } catch (err) {
    console.error('❌ Error in payment verification or booking:', err);
    res.status(500).json({ error: err.message });
  }
};
