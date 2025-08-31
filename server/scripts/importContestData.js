import fs from "fs/promises";
import mongoose from "mongoose";

import Problem from "../models/Problem.js";
import Contest from "../models/Contest.js";

const MONGO_URI = "mongodb://localhost:27017/flipgame";
const JSON_PATH = "../leetcode_contests.json";
const BULK_SIZE = 200;

function contestTypeFromKey(key) {
  if (!key) return null;
  const k = String(key).toLowerCase();
  if (k === "weekly") return "Weekly";
  if (k === "biweekly") return "Biweekly";
  return key;
}

function secondsToDate(sec) {
  if (sec == null) return new Date();
  // some inputs may be in seconds (as in your example)
  // if value looks like milliseconds (>1e12) assume ms
  const n = Number(sec);
  if (Number.isNaN(n)) return new Date();
  if (n > 1e12) return new Date(n); // milliseconds already
  return new Date(n * 1000); // convert seconds -> ms
}

async function loadJson(path) {
  const raw = await fs.readFile(path, "utf8");
  return JSON.parse(raw);
}

async function buildQuestionIdMap(allQuestions) {
  // allQuestions is array of numerical/string question_id values (duplicates possible)
  const uniq = Array.from(new Set(allQuestions.filter((x) => x != null)));
  if (!uniq.length) return new Map();

  const docs = await Problem.find({ questionId: { $in: uniq } })
    .select("_id questionId")
    .lean();

  const map = new Map();
  for (const d of docs) {
    const qid = d.questionId;
    map.set(String(qid), String(d._id));
    map.set(Number(qid), String(d._id));
  }

  return map;
}

async function buildAllQuestionIdsFromData(data) {
  // data structure: { weekly: [...], biweekly: [...] }
  const all = [];
  for (const key of Object.keys(data)) {
    const arr = Array.isArray(data[key]) ? data[key] : [];
    for (const contestObj of arr) {
      const questions = contestObj.questions || [];
      for (const q of questions) {
        const qid = q.question_id ?? q.questionId ?? q.id;
        if (qid != null) all.push(qid);
      }
    }
  }
  return all;
}

function buildContestDoc(
  rawContestObj,
  contestTypeKey,
  questionIdToFrontendMap
) {
  const contestMeta = rawContestObj.contest || rawContestObj;
  const questionsArr = rawContestObj.questions || [];

  const contestId = contestMeta.id;
  const title = contestMeta.title || contestMeta.title;
  const slug =
    contestMeta.title_slug ||
    contestMeta.slug ||
    contestMeta.title_slug ||
    contestMeta.slug;
  const startTimeRaw =
    contestMeta.start_time || contestMeta.startTime || contestMeta.start_time;
  const startTime = secondsToDate(startTimeRaw);
  const contestType = contestTypeFromKey(contestTypeKey);

  // Build questions array by mapping question_id -> frontendId
  const questions = [];
  let skippedQuestions = 0;

  for (let i = 0; i < questionsArr.length; i++) {
    const q = questionsArr[i];
    const questionId = q.question_id ?? q.questionId ?? q.id;
    if (questionId == null) {
      skippedQuestions++;
      continue;
    }

    // lookup in map using both string and numeric variants
    const frontendId =
      questionIdToFrontendMap.get(String(questionId)) ??
      questionIdToFrontendMap.get(Number(questionId));

    if (!frontendId) {
      skippedQuestions++;
      continue;
    }

    questions.push({
      problem: frontendId,
      questionId: Number(questionId),
      questionPoints:
        typeof q.credit === "number" ? q.credit : Number(q.credit) || 1,
      questionNumber: i + 1,
    });
  }

  if (!contestId || !title || !slug) {
    return { doc: null, skippedQuestions, reason: "missing-meta" };
  }

  if (!questions.length) {
    return { doc: null, skippedQuestions, reason: "no-mapped-questions" };
  }

  const doc = {
    contestId: Number(contestId),
    title: String(title),
    slug: String(slug),
    startTime,
    contestType,
    questions,
  };

  return { doc, skippedQuestions };
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);

  console.log("Reading JSON from", JSON_PATH);
  const data = await loadJson(JSON_PATH);

  console.log("Collecting all question_ids from JSON...");
  const allQuestionIds = await buildAllQuestionIdsFromData(data);
  console.log(
    "Unique question IDs found in JSON:",
    new Set(allQuestionIds).size
  );

  console.log(
    "Querying Problem collection for mapping (questionId -> Problem._id) ..."
  );
  const questionIdToFrontendMap = await buildQuestionIdMap(allQuestionIds);
  console.log("Mapped question IDs found in DB:", questionIdToFrontendMap.size);

  // prepare bulk ops for contests
  const bulkOps = [];
  let totalContests = 0;
  let skippedContests = 0;
  let totalSkippedQuestions = 0;

  for (const key of Object.keys(data)) {
    const arr = Array.isArray(data[key]) ? data[key] : [];
    const contestTypeKey = key; // "weekly" or "biweekly"
    for (const rawContestObj of arr) {
      totalContests++;
      const { doc, skippedQuestions, reason } = buildContestDoc(
        rawContestObj,
        contestTypeKey,
        questionIdToFrontendMap
      );

      if (skippedQuestions) totalSkippedQuestions += skippedQuestions;

      if (!doc) {
        skippedContests++;
        if (reason) {
          console.warn(
            `Skipping contest (reason=${reason}) - contestMeta=${JSON.stringify(
              rawContestObj?.contest ?? {}
            ).slice(0, 200)}`
          );
        }
        continue;
      }

      bulkOps.push({
        updateOne: {
          filter: { contestId: Number(doc.contestId) },
          update: { $set: doc },
          upsert: true,
        },
      });

      if (bulkOps.length >= BULK_SIZE) {
        const ops = bulkOps.splice(0, bulkOps.length);
        try {
          const res = await Contest.bulkWrite(ops, { ordered: false });
          console.log(
            `bulkWrite batch done. nUpserted/modified: ${
              res.nUpserted ?? res.upsertedCount
            }, ${res.nModified ?? res.modifiedCount}`
          );
        } catch (err) {
          console.error("bulkWrite error:", err);
        }
      }
    }
  }

  if (bulkOps.length) {
    try {
      const res = await Contest.bulkWrite(bulkOps, { ordered: false });
      console.log(
        `final bulkWrite done. nUpserted/modified: ${
          res.nUpserted ?? res.upsertedCount
        }, ${res.nModified ?? res.modifiedCount}`
      );
    } catch (err) {
      console.error("final bulkWrite error:", err);
    }
  }

  console.log("Summary:");
  console.log("  total contests seen in JSON:", totalContests);
  console.log(
    "  contests skipped (no mapped questions or missing meta):",
    skippedContests
  );
  console.log(
    "  total question mappings missing/skipped:",
    totalSkippedQuestions
  );

  await mongoose.disconnect();
  console.log("Disconnected. Done.");
}

/* run */
run().catch(async (err) => {
  console.error("Fatal:", err);
  try {
    await mongoose.disconnect();
  } catch (e) {}
  process.exit(1);
});
