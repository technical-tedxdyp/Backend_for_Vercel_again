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
    enum: ['Morning Session', 'Full Day Session', 'Evening Session'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    required: true
  },
  razorpaySignature: {
    type: String,
    required: true
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
    default: uuidv4  // Automatically generates unique id if not provided
  }
});

// Removed pre-validation hook for ticketId because default handles this

module.exports = mongoose.model('Ticket', TicketSchema);
