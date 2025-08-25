 // models/Counter.js

// const mongoose = require('mongoose');

// const counterSchema = new mongoose.Schema({
//   _id: {
//     type: String,      // Name of the sequence, e.g., 'ticketId'
//     required: true
//   },
//   sequence_value: {
//     type: Number,
//     default: 0
//   }
// }, { collection: 'counters' }); // Explicitly names the collection

// module.exports = mongoose.model('Counter', counterSchema);

// New updated code with ticket limiting
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  morning_sold: { type: Number, default: 0 },
  evening_sold: { type: Number, default: 0 },
  fullday_sold: { type: Number, default: 0 },
  total_limit: { type: Number, default: 400 }
}, { collection: 'counters' }); // Keep explicit collection name if you want

module.exports = mongoose.model('Counter', counterSchema);
