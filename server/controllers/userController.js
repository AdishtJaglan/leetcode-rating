import axios from "axios";
import User from "../models/User.js";
import Problem from "../models/Problem.js";

export const setUserData = async (req, res, next) => {
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
};

export const getDailySolves = async (req, res, next) => {
  console.log(req?.user);
  return res.status(200).json({ message: "hit the endpoint yo." });
};
