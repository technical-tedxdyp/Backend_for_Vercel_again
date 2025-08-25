const Counter = require('../models/Counter');
const Ticket = require('../models/Ticket');

// Helper to fetch counter, create if missing
const getOrCreateCounter = async () => {
  let counter = await Counter.findOne();
  if (!counter) {
    counter = await Counter.create({ total_limit: 400 });
  }
  return counter;
};

/**
 * Atomically books a ticket for a given sessionType (morning, evening, fullday)
 * Throws an error if tickets sold out or session unavailable
 * @param {String} sessionType - "morning", "evening", or "fullday"
 * @param {Object} userData - user info like name, email, phone, etc.
 * @returns {Object} booked ticket and updated counter document
 */
const bookTicket = async (sessionType, userData) => {
  if (!['morning', 'evening', 'fullday'].includes(sessionType)) {
    throw new Error('Invalid session type');
  }

  let updateQuery = {};
  let sessionCheck = {};

  if (sessionType === 'morning') {
    sessionCheck = {
      _id: 'ticket_counters',
      $expr: {
        $and: [
          { $lt: [{ $add: ['$morning_sold', '$evening_sold', '$fullday_sold'] }, 400] },
          { $lt: [{ $add: ['$morning_sold', '$fullday_sold'] }, 400] }
        ],
      },
    };
    updateQuery = { $inc: { morning_sold: 1 } };
  } else if (sessionType === 'evening') {
    sessionCheck = {
      _id: 'ticket_counters',
      $expr: {
        $and: [
          { $lt: [{ $add: ['$morning_sold', '$evening_sold', '$fullday_sold'] }, 400] },
          { $lt: [{ $add: ['$evening_sold', '$fullday_sold'] }, 400] }
        ],
      },
    };
    updateQuery = { $inc: { evening_sold: 1 } };
  } else if (sessionType === 'fullday') {
    sessionCheck = {
      _id: 'ticket_counters',
      $expr: {
        $lt: [{ $add: ['$morning_sold', '$evening_sold', '$fullday_sold'] }, 400],
      },
    };
    updateQuery = { $inc: { fullday_sold: 1 } };
  }

  // Ensure counter document exists (creates on first run)
  await getOrCreateCounter();

  // Atomic update to increment the correct session count
  const counter = await Counter.findOneAndUpdate(sessionCheck, updateQuery, {
    new: true,
  });

  if (!counter) {
    throw new Error('Tickets sold out or session unavailable');
  }

  // Save ticket details to DB
  const ticket = await Ticket.create({
    ...userData,
    session: sessionType,
  });

  return { ticket, counter };
};

module.exports = { bookTicket };
