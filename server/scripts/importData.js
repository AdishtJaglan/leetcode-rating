import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import Problem from "../models/Problem.js";
import { config } from "dotenv";
config();
const MONGO_URI = process.env.MONGO_URI;

async function importData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for import");

    try {
      await Problem.collection.dropIndex("id_1");
    } catch (err) {
      if (err.codeName === "IndexNotFound") {
        console.log("No legacy `id` index to drop");
      } else {
        throw err;
      }
    }

    await Problem.deleteMany({});
    console.log("Cleared existing problems collection");

    const filePath = path.resolve("scripts", "problems.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const items = JSON.parse(raw);

    for (const obj of items) {
      const cleanTitle = obj.title.replace(/\n[\s\S]*$/, "").trim();
      const doc = {
        _id: obj.id,
        title: cleanTitle,
        rating: obj.rating ? Number(obj.rating) : undefined,
      };

      await Problem.updateOne(
        { _id: doc._id },
        { $set: doc },
        { upsert: true }
      );
    }

    console.log("Data import complete");
    process.exit(0);
  } catch (err) {
    console.error("Import error:", err);
    process.exit(1);
  }
}

importData();
