import { Types } from "mongoose";
import axios from "axios";
import User from "../models/User.js";
import Problem from "../models/Problem.js";

// setting user data [intial]
// POST /user/data
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

    // 2) fetch contest meta data
    const { userContestRanking } = await gql({
      query: `
        query userContestRankingInfo($username: String!) {
          userContestRanking(username: $username) {
            attendedContestsCount
            rating
            globalRanking
            topPercentage
            badge { name }
          }
        }`,
      variables: { username },
    });

    const cr = userContestRanking || {};

    let badges = [];
    if (cr.badge) {
      if (Array.isArray(cr.badge)) {
        badges = cr.badge
          .map((b) => (typeof b === "string" ? b : b?.name || null))
          .filter(Boolean);
      } else {
        badges = [
          typeof cr.badge === "string" ? cr.badge : cr.badge?.name,
        ].filter(Boolean);
      }
    }

    const contestRanking = {
      attendedContestsCount: cr.attendedContestsCount ?? null,
      rating: cr.rating ?? null,
      globalRanking: cr.globalRanking ?? null,
      totalParticipants: cr.totalParticipants ?? null,
      topPercentage: cr.topPercentage ?? null,
      badges: badges.map((name) => ({ name })),
    };

    // 3) fetch submission counts
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

    // 4) fetch the list of solved questions
    const { userProgressQuestionList } = await gql(
      {
        query: `
        query($skip: Int!, $limit: Int!) {
          userProgressQuestionList(filters: { skip: $skip, limit: $limit }) {
            questions {
              frontendId title difficulty lastSubmittedAt titleSlug questionStatus lastResult topicTags  { name }
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

    const questions = userProgressQuestionList.questions.filter(
      (q) => q.questionStatus === "SOLVED"
    );

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
        slug: q?.titleSlug,
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
      contestMetaData: contestRanking,
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

// number of question solved on a given day
// TODO [client] heatmap
// GET /user/daily-solve
export const getDailySolves = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;
    const results = await User.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      { $unwind: "$solvedProblems" },
      {
        $addFields: {
          day: {
            $dateTrunc: {
              date: "$solvedProblems.lastSubmittedAt",
              unit: "day",
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
      { $group: { _id: "$day", count: { $sum: 1 } } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1,
        },
      },
      { $sort: { _id: 1 } },
    ]);

    if (!results) {
      return res.status(404).json({ message: "No data found." });
    }
    return res
      .status(200)
      .json({ message: "Fetched data", questions: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// most active hours [UTC]
// TODO [client] Radar chart maybe
// GET /user/active-hours
export const getActiveHours = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;
    const objectId = new Types.ObjectId(id);

    const agg = await User.aggregate([
      { $match: { _id: objectId } },
      { $unwind: "$solvedProblems" },
      {
        $project: {
          hourUtc: {
            $hour: { date: "$solvedProblems.lastSubmittedAt", timezone: "UTC" },
          },
        },
      },
      { $group: { _id: "$hourUtc", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          hour: "$_id",
          count: 1,
        },
      },
    ]);

    const countsByHour = new Array(24).fill(0);
    for (const row of agg) {
      const h = Number(row.hour);
      if (!Number.isNaN(h) && h >= 0 && h <= 23) countsByHour[h] = row.count;
    }

    const hours = countsByHour.map((count, hour) => {
      const hh = String(hour).padStart(2, "0");
      const iso = `1970-01-01T${hh}:00:00Z`;
      const label = `${hh}:00 UTC`;
      return { hour, iso, label, count };
    });

    return res.status(200).json({ message: "Fetched data", hours });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// average no easy - medium - hard questions solved
// TODO [client] create a radial chart with this
// GET /user/difficulty-dist
export const getDifficultyDist = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;

    const result = await User.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      { $unwind: "$solvedProblems" },
      {
        $group: {
          _id: "$solvedProblems.problemId",
          difficulty: { $first: "$solvedProblems.difficulty" },
        },
      },
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          difficulty: "$_id",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    if (!result.length) {
      return res.status(404).json({ message: "No data found." });
    }

    return res.status(200).json({
      message: "Fetched data",
      questions: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// shows number of questions solved for each rating range
// TODO [client] create a bar chart with this data
// GET /user/rating-dist
export const getRatingDist = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;
    const objectId = new Types.ObjectId(id);

    const boundaries = [0, 500];
    for (let r = 600; r <= 2800; r += 100) boundaries.push(r);
    boundaries.push(10000000);

    const labels = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const lo = boundaries[i];
      const hi = boundaries[i + 1] - 1;
      if (i === boundaries.length - 2) labels.push(`${lo}+`);
      else labels.push(`${lo}-${hi}`);
    }

    const pipeline = [
      { $match: { _id: objectId } },
      { $unwind: "$solvedProblems" },
      {
        $group: {
          _id: "$solvedProblems.problemId",
          rating: { $first: "$solvedProblems.ratingAtSolve" },
        },
      },
      {
        $addFields: {
          rating: {
            $cond: [
              { $ifNull: ["$rating", false] },
              { $toDouble: "$rating" },
              0,
            ],
          },
        },
      },
      {
        $bucket: {
          groupBy: "$rating",
          boundaries: boundaries,
          default: "Other",
          output: {
            count: { $sum: 1 },
          },
        },
      },
      {
        $addFields: {
          lowerBound: { $cond: [{ $eq: ["$_id", "Other"] }, null, "$_id"] },
        },
      },
      {
        $addFields: {
          bucketIndex: {
            $cond: [
              { $eq: ["$lowerBound", null] },
              -1,
              { $indexOfArray: [boundaries, "$lowerBound"] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          label: {
            $cond: [
              { $eq: ["$bucketIndex", -1] },
              "Other",
              { $arrayElemAt: [labels, "$bucketIndex"] },
            ],
          },
          min: "$lowerBound",
          max: {
            $cond: [
              {
                $or: [
                  { $eq: ["$bucketIndex", -1] },
                  { $eq: ["$bucketIndex", labels.length - 1] },
                ],
              },
              null,
              {
                $subtract: [
                  { $arrayElemAt: [boundaries, { $add: ["$bucketIndex", 1] }] },
                  1,
                ],
              },
            ],
          },
          count: 1,
        },
      },
      { $sort: { min: 1 } },
    ];

    const result = await User.aggregate(pipeline);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No data found." });
    }

    return res.status(200).json({
      message: "Fetched data",
      buckets: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// average rating of questions solved daily
// GET /user/rating-daily
export const getDailySolveRating = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;
    const result = await User.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      { $unwind: "$solvedProblems" },
      {
        $addFields: {
          day: {
            $dateTrunc: {
              date: "$solvedProblems.lastSubmittedAt",
              unit: "day",
              timezone: "Asia/Kolkata",
            },
          },
        },
      },
      {
        $group: {
          _id: "$day",
          avgRating: { $avg: "$solvedProblems.ratingAtSolve" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$_id",
              timezone: "Asia/Kolkata",
            },
          },
          avgRating: { $round: ["$avgRating", 2] },
        },
      },
      { $sort: { date: 1 } },
    ]);

    if (!result.length) {
      return res.status(404).json({ message: "No data found." });
    }

    return res.status(200).json({ message: "Fetched data", questions: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// get user image, name & contest meta data [if it exists]
// GET /user/data
export const getBasicUserData = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;
    const user = await User.findById(id)
      .select("-_id leetcodeUserName leetcodeAvatar contestMetaData")
      .lean();
    return res.status(200).json({ message: "Fetched.", user });
  } catch (error) {
    return res.stats(500).json({ message: "Error fetching user data.", error });
  }
};
