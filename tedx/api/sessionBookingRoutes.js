const express = require('express');
const router = express.Router();
const { bookTicket } = require('../utils/sessionBookingController');

router.post('/book-ticket', async (req, res) => {
  const { sessionType, ...userData } = req.body;
  try {
    const { ticket, counter } = await bookTicket(sessionType, userData);
    res.json({ success: true, ticket, counter });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
