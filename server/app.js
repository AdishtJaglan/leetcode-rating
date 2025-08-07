import express from "express";
import axios from "axios";
import cors from "cors";
import mongoose from "mongoose";
import Problem from "./models/Problem.js";
import logger from "./utils/logger.js";

const app = express();
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/flipgame";

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

  const url = "https://leetcode.com/graphql/";
  const payload = {
    query: `
    query userProgressQuestionList($filters: UserProgressQuestionListInput) {
      userProgressQuestionList(filters: $filters) {
        totalNum
        questions {
          translatedTitle
          frontendId
          title
          titleSlug
          difficulty
          lastSubmittedAt
          numSubmitted
          questionStatus
          lastResult
          topicTags {
            name
            nameTranslated
            slug
          }
        }
      }
    }
  `,
    variables: { filters: { skip: 0, limit: 400 } },
    operationName: "userProgressQuestionList",
  };

  try {
    const { data: response } = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Origin: "https://leetcode.com",
        Referer: "https://leetcode.com/progress/",
        "X-CSRFToken": CSRFToken,
        Cookie: `LEETCODE_SESSION=${LEETCODE_SESSION}`,
      },
    });

    const questions = response?.data?.userProgressQuestionList?.questions;
    console.log(questions);
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
  const { questions } = req.body;

  try {
    const responses = await Promise.all(
      questions.map(async (q) => {
        const match = q.match(/^(\d+)\./);
        if (!match) {
          throw new Error('Title must start with "<id>."');
        }
        const id = match[1];
        const problem = await Problem.findOne({ id });
        return {
          id: id,
          rating: problem?.rating,
        };
      })
    );

    const responseObject = responses.reduce((acc, item) => {
      acc[item.id] = item.rating;
      return acc;
    }, {});

    return res.json({ message: "received.", data: responseObject });
  } catch (error) {
    return res.status(400).json({ error: error.message });
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

app.listen(3000, () => {
  console.log("Listening on port 3000.");
});
