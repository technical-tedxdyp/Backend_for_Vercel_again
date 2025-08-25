const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TicketSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: false,
    trim: true
  },
  branch: {
    type: String,
    required: false,
    trim: true
  },
  session: {
    type: String,
    enum: ['morning', 'evening', 'fullday'],  // Updated to consistent enum values
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: false
  },
  razorpayPaymentId: {
    type: String,
    required: false
  },
  razorpaySignature: {
    type: String,
    required: false
  },
  paymentId: {  // Optional, you can remove if you use razorpay fields only
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: uuidv4  // Automatically generate unique id if not provided
  }
});

module.exports = mongoose.model('Ticket', TicketSchema);
