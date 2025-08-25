const Ticket = require('../models/Ticket');
const connectDB = require('../utils/db');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

let dbInitPromise = null;
const ensureDBConnection = async () => {
  if (!dbInitPromise) {
    dbInitPromise = connectDB();
  }
  return dbInitPromise;
};

// GET /api/tickets - fetch all tickets
exports.getAllTickets = async (req, res) => {
  try {
    await ensureDBConnection();
    const tickets = await Ticket.find({});
    res.json(tickets);
  } catch (err) {
    console.error('❌ Error fetching all tickets:', err);
    res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
};

// GET /api/tickets/:id - fetch ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    await ensureDBConnection();
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json(ticket);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }
    console.error('❌ Error fetching ticket by ID:', err);
    res.status(500).json({ error: 'Failed to retrieve ticket' });
  }
};

// Helper function to create and save a new ticket
exports.createTicket = async (userData, sessionType, amount, paymentId) => {
  await ensureDBConnection();
  const ticket = new Ticket({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    department: userData.department,
    branch: userData.branch,
    session: sessionType,
    amount,
    paymentId
  });

  await ticket.save();
  return ticket;
};
