import fs from "fs/promises";
import mongoose from "mongoose";
import Problem from "../models/Problem.js";

const MONGO_URI = "mongodb://localhost:27017/flipgame";
const JSON_FILE = "../problems.json";

async function main() {
  await mongoose.connect(MONGO_URI);

  const raw = await fs.readFile(JSON_FILE, "utf8");
  const arr = JSON.parse(raw);

  if (!arr.length) {
    console.error(
      "No items found in JSON. Expected an array or data.allQuestions / allQuestions."
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const ops = arr
    .map((item) => {
      const frontend = item?.questionFrontendId;
      const qid = item?.questionId;
      if (frontend == null || qid == null) return null;
      return {
        updateOne: {
          filter: { _id: frontend },
          update: { $set: { questionId: qid } },
          upsert: false,
        },
      };
    })
    .filter(Boolean);

  if (ops.length === 0) {
    console.error("No valid items (missing questionFrontendId or questionId).");
    await mongoose.disconnect();
    process.exit(1);
  }

  try {
    const res = await Problem.bulkWrite(ops, { ordered: false });
    console.log("Bulk update result:", res);
  } catch (err) {
    console.error("bulkWrite error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
