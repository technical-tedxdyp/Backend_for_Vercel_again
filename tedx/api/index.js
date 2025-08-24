const express = require("express");
const connectDB = require("../utils/db");
const cors = require("cors");
require("dotenv").config(); // Load env for local development

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

app.use("/api/payment", require("./paymentRoutes"));

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

let dbConnected = false;

module.exports = async (req, res) => {
  try {
    if (!dbConnected) {
      await connectDB(process.env.TEDX_MONGO_URI);
      dbConnected = true;
      console.log("✅ MongoDB connection established.");
    }
    return app(req, res);
  } catch (err) {
    console.error("❌ Database connection error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
