const express = require("express");
const connectDB = require("../utils/db");
const cors = require("cors");

const paymentRoutes = require("./paymentRoutes");
const sessionBookingRoutes = require("./sessionBookingRoutes");

const allowedOrigins = [
  "https://tedx-dyp-akurdi-yqm8-7f2qq97g5-saurabhmelgirkars-projects.vercel.app",
  "https://tedx-dyp-akurdi.vercel.app",
  "http://localhost:3000",
  "http://localhost:1234",
  "http://127.0.0.1:1234",
  "https://tedxdevv.netlify.app",
];

let dbConnected = false;

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/payment", paymentRoutes);
app.use("/api/session", sessionBookingRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

module.exports = async (req, res) => {
  if (!dbConnected) {
    await connectDB(process.env.TEDX_MONGO_URI);
    dbConnected = true;
    console.log("✅ MongoDB connected");
  }
  return app(req, res);
};
