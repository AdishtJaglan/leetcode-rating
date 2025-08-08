import express from "express";
import axios from "axios";
import cors from "cors";
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import Problem from "./models/Problem.js";
import User from "./models/User.js";
import logger from "./utils/logger.js";

configDotenv();
const app = express();
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/flipgame";
const PORT = process.env.CURR_PORT ?? 3000;

app.use(
  cors({
    origin: "https://leetcode.com",
  })
);

app.use(express.json());
app.use(logger);

app.post("/data", async (req, res, next) => {
  try {
    const { cookies } = req.body;
    const [sessionCookie, csrfCookie] = cookies;
    const LEETCODE_SESSION = sessionCookie.value;
    const CSRFToken = csrfCookie.value;
    const GRAPHQL_URL = "https://leetcode.com/graphql/";

    const baseHeaders = {
      "Content-Type": "application/json",
      Origin: "https://leetcode.com",
      "X-CSRFToken": CSRFToken,
      Cookie: `LEETCODE_SESSION=${LEETCODE_SESSION};`,
    };

    const gql = (body, extraHeaders = {}) =>
      axios
        .post(GRAPHQL_URL, body, {
          headers: { ...baseHeaders, ...extraHeaders },
        })
        .then((r) => r.data.data);

    // 1) fetch global user info
    const { userStatus } = await gql({
      query: `query { userStatus { username avatar } }`,
    });

    const username = userStatus.username;
    const avatar = userStatus.avatar;

    // 2) fetch submission counts
    const { matchedUser } = await gql({
      query: `
        query($username: String!) {
          matchedUser(username: $username) {
            submitStats {
              acSubmissionNum { difficulty count submissions }
            }
          }
        }`,
      variables: { username },
    });

    const submissions = matchedUser.submitStats.acSubmissionNum;
    const totalSolved = submissions.find((x) => x.difficulty === "All").count;

    // 3) fetch the list of solved questions
    const { userProgressQuestionList } = await gql(
      {
        query: `
        query($skip: Int!, $limit: Int!) {
          userProgressQuestionList(filters: { skip: $skip, limit: $limit }) {
            questions {
              frontendId title difficulty lastSubmittedAt topicTags { name }
            }
          }
        }`,
        variables: { skip: 0, limit: totalSolved },
      },
      {
        Referer: "https://leetcode.com/progress/",
        Accept: "*/*",
      }
    );

    const questions = userProgressQuestionList.questions;

    const ids = questions.map((q) => q.frontendId);
    const docs = await Problem.find({ _id: { $in: ids } })
      .select("rating")
      .lean();

    const ratingById = docs.reduce((m, { _id, rating }) => {
      m[_id] = rating;
      return m;
    }, {});

    let ratingSum = 0;
    const solvedProblems = questions.map((q) => {
      const rating = ratingById[q.frontendId] || 0;
      ratingSum += rating;
      return {
        problemId: q.frontendId,
        difficulty: q.difficulty,
        lastSubmittedAt: new Date(q.lastSubmittedAt),
        topicTags: q.topicTags.map((t) => t.name),
        ratingAtSolve: rating,
      };
    });

    const averageRating = ratingSum / solvedProblems.length || 0;

    const userData = {
      sessionToken: LEETCODE_SESSION,
      csrfToken: CSRFToken,
      leetcodeUserName: username,
      leetcodeAvatar: avatar,
      totalProblemsSolved: totalSolved,
      leetcodeSubmissions: submissions,
      averageRating: parseFloat(averageRating.toFixed(2)),
      solvedProblems,
    };

    const user = await User.findOneAndUpdate(
      { leetcodeUserName: username },
      userData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ message: "Data synced successfully", user });
  } catch (err) {
    next(err);
  }
});

app.post("/rate", async (req, res) => {
  try {
    const { title } = req.body;
    if (typeof title !== "string") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const match = title.match(/^(\d+)\./);
    if (!match) {
      return res.status(400).json({ error: 'Title must start with "<id>."' });
    }
    const id = match[1];

    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ error: `No problem found with id ${id}` });
    }

    return res.status(200).json({ rating: problem.rating });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/rate-batch", async (req, res) => {
  try {
    const questions = req.body.questions || [];
    const ids = questions.map((q) => {
      const m = q.match(/^(\d+)\./);
      if (!m) throw new Error('Title must start with "<id>."');
      return m[1];
    });

    const docs = await Problem.find({ _id: { $in: ids } })
      .select("rating _id")
      .lean();

    const ratingById = docs.reduce((map, { _id, rating }) => {
      map[_id] = rating;
      return map;
    }, Object.create(null));

    const responseObject = ids.reduce((out, id) => {
      out[id] = ratingById[id] ?? null;
      return out;
    }, {});

    res.json({ message: "received.", data: responseObject });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

async function dbConnect() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

dbConnect();

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}.`);
});
