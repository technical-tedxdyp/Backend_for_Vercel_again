const mongoose = require('mongoose');

let connection = {
  isConnected: false,
};

const connectDB = async () => {
  if (connection.isConnected) {
    console.log('✅ Using existing MongoDB connection.');
    return;
  }

  const mongoURI = process.env.TEDX_MONGO_URI;

  if (!mongoURI) {
    throw new Error('MongoDB URI not found. Please set TEDX_MONGO_URI in environment variables.');
  }

  try {
    const db = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    connection.isConnected = db.connections[0].readyState === 1;

    console.log('✅ New MongoDB connection established.');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    throw new Error('Failed to connect to MongoDB');
  }
};

// Optional: Connection event listeners for additional logging
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Handle app termination gracefully
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
