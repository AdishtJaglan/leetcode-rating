import express from "express";
import axios from "axios";
import cors from "cors";
import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import Problem from "./models/Problem.js";
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

app.post("/data", async (req, res) => {
  const { cookies } = req?.body;
  const LEETCODE_SESSION = cookies[0]?.value;
  const CSRFToken = cookies[1]?.value;
  let username = "";
  let questionCnt = "";

  const url = "https://leetcode.com/graphql/";

  const headers = {
    "Content-Type": "application/json",
    Origin: "https://leetcode.com",
    "X-CSRFToken": CSRFToken,
    Cookie: `LEETCODE_SESSION=${LEETCODE_SESSION};`,
  };

  // ——————————————————————————————
  // This body fetches the username
  // ——————————————————————————————
  const body = {
    query: `
      query globalData {
        userStatus {
          userId
          username
          realName
          avatar
          activeSessionId
        }
      }
    `,
    variables: {},
    operationName: "globalData",
  };

  try {
    const { data } = await axios.post(url, body, { headers });
    const dataBody = data?.data;
    username = dataBody?.userStatus?.username;
  } catch (err) {
    console.error("Request failed:", err);
    throw err;
  }

  // ——————————————————————————————
  // This body fetches the count of questions solved
  // ——————————————————————————————
  const questionCntBody = {
    query: `
      query userSessionProgress($username: String!) {
        allQuestionsCount {
          difficulty
          count
        }
        matchedUser(username: $username) {
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
      }
    `,
    variables: {
      username: username,
    },
    operationName: "userSessionProgress",
  };

  try {
    const { data } = await axios.post(url, questionCntBody, { headers });
    questionCnt = data?.data?.matchedUser?.submitStats?.acSubmissionNum?.find(
      (item) => item.difficulty === "All"
    )?.count;
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }

  // ——————————————————————————————
  // This body fetches the questions solved by the user
  // ——————————————————————————————
  const questionsBody = {
    query: `
    query userProgressQuestionList($filters: UserProgressQuestionListInput) {
      userProgressQuestionList(filters: $filters) {
        questions {
          frontendId
          title
          difficulty
          lastSubmittedAt
          questionStatus
          topicTags {
            name
            nameTranslated
            slug
          }
        }
      }
    }
  `,
    variables: { filters: { skip: 0, limit: questionCnt } },
    operationName: "userProgressQuestionList",
  };

  try {
    const { data } = await axios.post(url, questionsBody, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Origin: "https://leetcode.com",
        Referer: "https://leetcode.com/progress/",
        "X-CSRFToken": CSRFToken,
        Cookie: `LEETCODE_SESSION=${LEETCODE_SESSION}`,
      },
    });
    console.log(data?.data?.userProgressQuestionList?.questions);
  } catch (error) {
    console.error(error);
  }

  return res.json({ message: "Received data." });
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

    const problem = await Problem.findOne({ id });
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

    const docs = await Problem.find({ id: { $in: ids } })
      .select("id rating -_id")
      .lean();

    const ratingById = docs.reduce((m, doc) => {
      m[doc.id] = doc.rating;
      return m;
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
