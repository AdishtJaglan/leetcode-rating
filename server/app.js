import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { configDotenv } from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import logger from "./utils/logger.js";

configDotenv();
const app = express();
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/flipgame";
const PORT = process.env.CURR_PORT ?? 3000;

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
    origin: "https://leetcode.com",
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
