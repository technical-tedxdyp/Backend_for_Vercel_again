const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');
const paymentRoutes = require('./paymentRoutes');

const app = express();
app.use(express.json());

const allowedOrigins = [
  "https://tedx-dyp-akurdi-yqm8-7f2qq97g5-saurabhmelgirkars-projects.vercel.app",
  "https://tedx-dyp-akurdi.vercel.app",
  "http://localhost:3000",
  "http://localhost:1234",
  "http://127.0.0.1:1234",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

let dbConnectionPromise = null;

app.use(async (req, res, next) => {
  try {
    if (!dbConnectionPromise) {
      dbConnectionPromise = connectDB();
    }
    await dbConnectionPromise;
    next();
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

module.exports = app;
