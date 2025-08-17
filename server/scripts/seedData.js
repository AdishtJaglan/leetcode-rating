import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_PATH = "../models/Problem.js";
const QUESTIONS_FILE = path.join(__dirname, "questions.json");
const PROBLEMS_FILE = path.join(__dirname, "problems.json");

const BATCH_SIZE = 1000;

const loadProblemModel = async (modelPath) => {
  try {
    const absPath = path.isAbsolute(modelPath)
      ? modelPath
      : path.resolve(__dirname, modelPath);
    const url = `file://${absPath}`;
    const mod = await import(url);
    return mod.default ?? mod;
  } catch (err) {
    try {
      const mod = await import(modelPath);
      return mod.default ?? mod;
    } catch (err2) {
      throw new Error(
        `Failed to import Problem model from '${modelPath}': ${err.message}; fallback error: ${err2.message}`
      );
    }
  }
};

const parseIntSafe = (v) => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};

async function main() {
  const mongoUri =
    process.env.MONGO_URI ?? "mongodb://localhost:27017/flipgame";

  let Problem;
  try {
    Problem = await loadProblemModel(MODEL_PATH);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB:", mongoUri);
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }

  let questionsRaw, problemsRaw;
  try {
    [questionsRaw, problemsRaw] = await Promise.all([
      fs.readFile(QUESTIONS_FILE, "utf8"),
      fs.readFile(PROBLEMS_FILE, "utf8"),
    ]);
  } catch (err) {
    console.error("Failed to read JSON files:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }

  let questions, problems;
  try {
    questions = JSON.parse(questionsRaw);
    problems = JSON.parse(problemsRaw);
  } catch (err) {
    console.error("Invalid JSON:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }

  const problemsMap = new Map();
  for (const p of problems) {
    const key = String(p.id ?? "").trim();
    const ratingNum = parseIntSafe(p.rating);
    problemsMap.set(key, ratingNum);
  }

  const bulkOps = [];
  for (const q of questions) {
    const frontendId =
      q.questionFrontendId != null
        ? String(q.questionFrontendId).trim()
        : undefined;
    if (!frontendId) {
      console.warn(
        "Skipping question with missing questionFrontendId:",
        q.title ?? JSON.stringify(q).slice(0, 80)
      );
      continue;
    }

    const questionIdNum = parseIntSafe(q.questionId);
    const ratingFromProblems = problemsMap.has(frontendId)
      ? problemsMap.get(frontendId)
      : 0;

    const doc = {
      _id: frontendId,
      questionId: questionIdNum,
      title: q.title ?? "",
      titleSlug: q.titleSlug ?? "",
      difficulty: q.difficulty ?? "",
      isPaidOnly: Boolean(q.isPaidOnly),
      topicTags: Array.isArray(q.topicTags)
        ? q.topicTags.map((t) => ({ name: t?.name ?? "", slug: t?.slug ?? "" }))
        : [],
      rating: Number.isFinite(Number(ratingFromProblems))
        ? Number(ratingFromProblems)
        : 0,
    };

    bulkOps.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: doc },
        upsert: true,
      },
    });
  }

  if (bulkOps.length === 0) {
    console.log("No valid documents to upsert. Exiting.");
    await mongoose.disconnect();
    return;
  }

  try {
    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);
      const res = await Problem.bulkWrite(batch);
      console.log(
        `Processed batch ${Math.floor(i / BATCH_SIZE) + 1} (ops: ${
          batch.length
        }) - result:`,
        res
      );
    }

    console.log(`Done. Total documents prepared: ${bulkOps.length}`);

    try {
      await Promise.all([fs.unlink(QUESTIONS_FILE), fs.unlink(PROBLEMS_FILE)]);
      console.log("Deleted questions.json and problems.json");
    } catch (err) {
      console.error("Failed to delete JSON files:", err.message);
    }
  } catch (err) {
    console.error("bulkWrite failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
