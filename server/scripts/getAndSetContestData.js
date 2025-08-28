import mongoose from "mongoose";
import Problem from "../models/Problem.js";
import Contest from "../models/Contest.js";

import dotenv from "dotenv";
dotenv.config();

const headers = {
  accept: "*/*",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "en-US,en-IN;q=0.9,en;q=0.8",
  "content-type": "application/json",
};

async function fetchContestRange(type, start, end) {
  const results = [];
  for (let i = start; i <= end; i++) {
    const url = `https://leetcode.com/contest/api/info/${type}-contest-${i}/`;
    try {
      const res = await fetch(url, { method: "GET", headers });
      if (!res.ok) {
        console.log(`❌ ${type}-${i} failed: ${res.status}`);
        continue;
      }
      const json = await res.json();
      results.push(json);
      console.log(`✅ Fetched ${type}-${i}`);
    } catch (err) {
      console.error(`⚠️ Error fetching ${type}-${i}:`, err.message);
    }

    await new Promise((r) => setTimeout(r, 300));
  }
  return results;
}

(async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(
        process.env.MONGO_URI || "your-mongodb-connection-string"
      );
      console.log("✅ Connected to MongoDB");
    }

    const weeklyData = await fetchContestRange("weekly", 64, 464);
    const biweeklyData = await fetchContestRange("biweekly", 1, 163);

    const processContests = async (contests, contestType) => {
      return Promise.all(
        contests.map(async (c) => {
          const id = c?.contest?.id;
          const title = c?.contest?.title;
          const slug = c?.contest?.title_slug;
          const startTime = c?.contest?.start_time;

          let contestQuestions = [];

          const questionIds = c?.questions?.map((q) => q?.question_id) || [];
          console.log(`Looking up ${contestType} questions:`, questionIds);

          const problems = await Problem.find({
            questionId: { $in: questionIds },
          });
          console.log("Found problems:", problems.length);

          const problemLookup = problems.reduce((acc, problem) => {
            acc[problem.questionId] = problem._id;
            return acc;
          }, {});

          c?.questions.forEach((q) => {
            const questionId = q?.question_id;
            const questionCredits = q?.credit;
            const problemId = problemLookup[questionId] || null;

            contestQuestions.push({
              questionId,
              problemId,
              questionCredits,
            });
          });

          return {
            contestId: id,
            title,
            slug,
            startTime,
            contestType,
            questions: contestQuestions,
          };
        })
      );
    };

    const weeklyNormalised = await processContests(weeklyData, "Weekly");
    const biweeklyNormalised = await processContests(biweeklyData, "Biweekly");

    const normalised = [...weeklyNormalised, ...biweeklyNormalised];

    console.log("🗑️ Clearing Contest collection...");
    await Contest.deleteMany({});
    console.log("✅ Contest collection cleared");

    console.log("📝 Inserting new contest data...");
    const insertedContests = await Contest.insertMany(normalised);
    console.log(
      `✅ Successfully inserted ${insertedContests.length} contests into database`
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  }
})();
