import "./loadEnv.js";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import userRoutes from "./routes/userRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import logger from "./utils/logger.js";

const app = express();
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/flipgame";
const PORT = process.env.CURR_PORT ?? 3000;
const CLIENT_URL = process.env.CLIENT_URL;
const allowedOrigins = ["https://leetcode.com", CLIENT_URL];

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((error) => {
    console.error("Error connecting to DB:" + error.message);
  });

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(logger);

app.use("/api/user", userRoutes);
app.use("/api/problem", problemRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome." });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}.`);
});
