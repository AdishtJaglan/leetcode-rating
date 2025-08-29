import { Types } from "mongoose";
import axios from "axios";
import User from "../models/User.js";
import Problem from "../models/Problem.js";

import calculateWeakTopics from "../utils/calculateWeakTopics.js";
import isWeakTopicsCacheValid from "../utils/weakTopicsCache.js";

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
              frontendId
              title
              difficulty
              lastSubmittedAt
              titleSlug
              questionStatus
              lastResult
              numSubmitted
              topicTags { name }
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

    const allQuestions = userProgressQuestionList.questions;

    const solvedQuestions = allQuestions.filter(
      (q) => q.questionStatus === "SOLVED"
    );
    const failedQuestions = allQuestions.filter(
      (q) => q.questionStatus !== "SOLVED"
    );

    const ids = allQuestions.map((q) => q.frontendId);
    const docs = await Problem.find({ _id: { $in: ids } })
      .select("rating")
      .lean();

    const ratingById = docs.reduce((m, { _id, rating }) => {
      m[_id] = rating;
      return m;
    }, {});

    let ratingSum = 0;
    const solvedProblems = solvedQuestions.map((q) => {
      const rating = ratingById[String(q.frontendId)] || 0;
      ratingSum += rating;
      return {
        problemId: String(q.frontendId),
        difficulty: q.difficulty || "Unknown",
        slug: q?.titleSlug || "",
        lastSubmittedAt: q.lastSubmittedAt
          ? new Date(q.lastSubmittedAt)
          : new Date(),
        topicTags: Array.isArray(q.topicTags)
          ? q.topicTags.map((t) => t.name)
          : [],
        ratingAtSolve: rating,
        numSubmitted: q?.numSubmitted,
        lastResult: q?.lastResult,
      };
    });

    const averageRating = solvedProblems.length
      ? ratingSum / solvedProblems.length
      : 0;

    const failedProblems = failedQuestions.map((q) => {
      const rating = ratingById[String(q.frontendId)] || 0;
      return {
        problemId: String(q.frontendId),
        difficulty: q.difficulty || "Unknown",
        slug: q?.titleSlug || "",
        lastSubmittedAt: q.lastSubmittedAt
          ? new Date(q.lastSubmittedAt)
          : new Date(),
        ratingAtAttempt: rating,
        topicTags: Array.isArray(q.topicTags)
          ? q.topicTags.map((t) => t.name)
          : [],
        numSubmitted: q?.numSubmitted,
        lastResult: q?.lastResult,
      };
    });

    const userData = {
      sessionToken: LEETCODE_SESSION,
      csrfToken: CSRFToken,
      leetcodeUserName: username,
      leetcodeAvatar: avatar,
      totalProblemsSolved: totalSolved,
      leetcodeSubmissions: submissions,
      averageRating: parseFloat(averageRating.toFixed(2)),
      solvedProblems,
      failedProblems,
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

// this endpoints return the topics in which the user is weak,
// and needs some practice. Calculated based on their submission history
// We have assigned weights to each topic based on their rating, count while
// filtering out outliers. This weight along with time decay give a value
// that value tells us which topics to focus on.
// GET /user/topics
export const getWeakTopics = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;

    const user = await User.findById(id)
      .select("solvedProblems failedProblems weakTopicsCache")
      .lean();

    const currentSubmissionCount =
      (user?.solvedProblems?.length || 0) + (user?.failedProblems?.length || 0);
    const cacheValidityHours = 6; // Recalculate after 6 hours regardless

    // Check if we can use cached result, using helper
    const { valid, hoursSinceLastCalculation } = isWeakTopicsCacheValid(
      user?.weakTopicsCache,
      currentSubmissionCount,
      cacheValidityHours
    );

    if (valid) {
      return res.status(200).json({
        ...user.weakTopicsCache.result,
        cached: true,
        cacheAge: Math.round(hoursSinceLastCalculation * 100) / 100,
      });
    }

    const result = await calculateWeakTopics(
      user?.solvedProblems ?? [],
      user?.failedProblems ?? []
    );

    await User.findByIdAndUpdate(id, {
      weakTopicsCache: {
        result,
        lastCalculated: new Date(),
        submissionCount: currentSubmissionCount,
      },
    });

    return res.status(200).json({
      ...result,
      cached: false,
    });
  } catch (error) {
    console.error("Error in getWeakTopics:", error);
    return res.status(500).json({
      message: "Error occurred.",
      error: error.message,
    });
  }
};

// we use this endpoint to generate problem recommendations
// the recommendations are based on the rating of the user, their weak topics
// we can also add a flag "push" which increases the difficulty of the recommended problems
// TODO add support to let user pick their own preferred topic/s [could be better to create separate endpoint for this]
// POST /user/problem-recs?push=true&limit=[1-25]
export const getNewProblemRecs = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;
    const {
      minRating: minRaw = undefined,
      maxRating: maxRaw = undefined,
      preferredDifficulty: prefRaw,
      isPremium: isPremiumRaw = undefined,
    } = req?.body || {};

    const minRating = minRaw ?? 50;
    const maxRating = maxRaw ?? 100;

    const minNum = Number(minRating);
    const maxNum = Number(maxRating);

    if (!id) {
      return res.status(400).json({ error: "Missing user id" });
    }

    if (!Number.isFinite(minNum) || !Number.isFinite(maxNum)) {
      return res.status(400).json({ error: "Ratings must be numeric" });
    }

    if (minNum >= maxNum) {
      return res.status(400).json({
        mesage: "Minimum selected rating must be strictly lower than maximum.",
      });
    }

    const ALLOWED = new Set(["Easy", "Medium", "Hard"]);

    const parseBool = (v) => {
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v === 1;
      if (typeof v === "string") {
        const t = v.trim().toLowerCase();
        return t === "true" || t === "1" || t === "yes" || t === "y";
      }
      return false;
    };
    const isPremium = parseBool(isPremiumRaw ?? false);

    const normalize = (s) => {
      if (typeof s !== "string") return null;
      const t = s.trim();
      if (!t) return null;
      return t[0].toUpperCase() + t.slice(1).toLowerCase();
    };

    let difficultyFilterValues = null;
    if (prefRaw != null) {
      if (typeof prefRaw === "string") {
        const normalized = normalize(prefRaw);
        if (normalized) {
          if (!ALLOWED.has(normalized)) {
            return res.status(400).json({
              error:
                'preferredDifficulty must be one of "Easy", "Medium", "Hard" (or omitted).',
            });
          }
          difficultyFilterValues = [normalized];
        }
      } else if (Array.isArray(prefRaw)) {
        const normalizedArr = prefRaw.map(normalize).filter((v) => v !== null);
        const uniq = [...new Set(normalizedArr)];
        const hadInvalid = normalizedArr.some((v) => !ALLOWED.has(v));

        if (uniq.length === 0) {
          difficultyFilterValues = null;
        } else if (hadInvalid) {
          return res.status(400).json({
            error:
              'preferredDifficulty array may only contain "Easy", "Medium", "Hard" (case-insensitive).',
          });
        } else {
          difficultyFilterValues = uniq;
        }
      } else {
        return res.status(400).json({
          error: "preferredDifficulty must be a string or an array of strings.",
        });
      }
    }

    const push = req.query?.push === "true" || req.query?.push === true;
    const limit = Math.max(1, Math.min(25, Number(req.query?.limit || 12))); // clamp 1..25
    const candidateFetchLimit = 500; // fetch up to this many candidates to score and sort

    const user = await User.findById(id)
      .select(
        "solvedProblems failedProblems weakTopicsCache recentRecommendationHistory contestMetaData.rating"
      )
      .lean();

    const rating =
      (user?.contestMetaData?.rating && Number(user.contestMetaData.rating)) ||
      1500;

    const currentSubmissionCount =
      (user?.solvedProblems?.length || 0) + (user?.failedProblems?.length || 0);
    const cacheValidityHours = 6;

    // get weak topics (use cache if valid, otherwise compute + persist)
    let weakTopicsResult;
    const cacheCheck = isWeakTopicsCacheValid(
      user?.weakTopicsCache,
      currentSubmissionCount,
      cacheValidityHours
    );

    if (cacheCheck.valid) {
      weakTopicsResult = user.weakTopicsCache.result;
    } else {
      // compute fresh & persist
      weakTopicsResult = await calculateWeakTopics(
        user?.solvedProblems ?? [],
        user?.failedProblems ?? []
      );
      await User.findByIdAndUpdate(id, {
        weakTopicsCache: {
          result: weakTopicsResult,
          lastCalculated: new Date(),
          submissionCount: currentSubmissionCount,
        },
      });
    }

    const topicsObj = weakTopicsResult?.topics ?? weakTopicsResult ?? {};
    const tagWeights = Object.create(null);
    for (const [t, v] of Object.entries(topicsObj)) {
      const num = Number(v);
      if (Number.isFinite(num)) tagWeights[t.toLowerCase()] = num;
    }
    const tagList = Object.keys(tagWeights);
    if (tagList.length === 0) {
      return res.status(200).json({
        recommendedQuestions: [],
        message: "No weak-topic signal available",
      });
    }

    // rating window logic
    const window = push
      ? { min: rating + 100, max: rating + 200 }
      : { min: rating + minNum, max: rating + maxNum };

    // exclude solved problems
    const solvedQIds = (user?.solvedProblems ?? [])
      .map((q) => {
        try {
          // keep as string for $nin
          return q?.problemId instanceof mongoose.Types.ObjectId
            ? String(q.problemId)
            : q?.problemId;
        } catch {
          return q?.problemId;
        }
      })
      .filter(Boolean);

    const recentRecommendedQs = user?.recentRecommendationHistory || [];
    const recentIds = recentRecommendedQs.flat().map(String).filter(Boolean);

    const excludeSet = new Set([...solvedQIds, ...recentIds]);
    const excludeIds = Array.from(excludeSet);

    const query = {
      _id: { $nin: excludeIds },
      rating: { $gte: window.min, $lte: window.max },
      "topicTags.name": { $in: tagList },
    };
    query.isPaidOnly = isPremium;
    if (difficultyFilterValues) {
      query.difficulty = { $in: difficultyFilterValues };
    }

    const candidates = await Problem.find(query)
      .collation({ locale: "en", strength: 2 }) // !DO NOT TOUCH, this line help us deal with case invariance
      .select("title rating topicTags titleSlug difficulty")
      .limit(candidateFetchLimit)
      .lean();

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(200).json({ recommendedQuestions: [] });
    }

    const normalizeTags = (tarr) => {
      if (!Array.isArray(tarr)) return [];
      return tarr
        .map((t) => {
          if (typeof t === "string") return t.toLowerCase();
          if (t && typeof t.name === "string") return t.name.toLowerCase();
          if (t && typeof t.tag === "string") return t.tag.toLowerCase();

          try {
            return JSON.stringify(t).toLowerCase();
          } catch {
            return String(t).toLowerCase();
          }
        })
        .filter(Boolean);
    };

    //  - matchedScore = sum of tagWeights for tags that this problem has
    //  - matchFraction = matchedTagCount / totalTagCount (0..1)
    //  - brevityBonus = 1 + (1 / totalTagCount)  -> problems with fewer tags get slightly more weight
    //  - exactMatchBonus = 1.15 if matchedTagCount === totalTagCount (all tags match user's weak topics)
    //  - final weight = matchedScore * matchFraction * brevityBonus * exactMatchBonus
    // This favors: (a) problems whose matched tags have high weak-topic weights,
    // (b) problems that cover a high fraction of their tags with weak topics,
    // and (c) problems with fewer tags (brevity), and gives a small boost if all tags match.

    const scored = candidates.map((p) => {
      const pTags = normalizeTags(p.topicTags);
      const totalTagCount = pTags.length || 1;
      let matchedTags = [];
      let matchedWeightSum = 0;
      for (const t of pTags) {
        if (Object.prototype.hasOwnProperty.call(tagWeights, t)) {
          matchedTags.push(t);
          matchedWeightSum += tagWeights[t];
        }
      }
      const matchedCount = matchedTags.length;
      const matchFraction = matchedCount / totalTagCount;

      if (matchedCount === 0)
        return {
          problem: p,
          weight: 0,
          matchedTags: [],
          matchFraction: 0,
          totalTagCount,
        };

      const brevityBonus = 1 + 1 / totalTagCount;
      const exactMatchBonus = matchedCount === totalTagCount ? 1.15 : 1.0;

      const base = matchedWeightSum; // base importance coming from topic weights
      const weight = base * matchFraction * brevityBonus * exactMatchBonus;

      return {
        problem: p,
        weight,
        matchedTags,
        matchFraction,
        totalTagCount,
        matchedWeightSum: +matchedWeightSum.toFixed(4),
      };
    });

    // Filter out zero-weight and sort desc
    const finalSorted = scored
      .filter((s) => s.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);

    const questionIdsList = finalSorted.map((s) => String(s.problem._id));

    const recommendedQuestions = finalSorted.map((s) => {
      const p = s.problem;
      return {
        id: p._id,
        title: p.title ?? null,
        slug: p.titleSlug ?? null,
        rating: p.rating,
        difficulty: p.difficulty ?? null,
        tags: normalizeTags(p.topicTags),
        matchedTags: s.matchedTags,
        matchedWeightSum: s.matchedWeightSum,
        matchFraction: +s.matchFraction.toFixed(3),
        weight: +s.weight.toFixed(4),
      };
    });

    await User.findByIdAndUpdate(
      id,
      {
        $push: {
          recentRecommendationHistory: {
            $each: [questionIdsList],
            $slice: -3,
          },
        },
        $set: {
          currentRecommendation: recommendedQuestions,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      recommendedQuestions,
      metadata: {
        userRating: rating,
        ratingWindow: window,
        push,
        tagsConsidered: tagList.length,
        candidatesConsidered: candidates.length,
      },
    });
  } catch (error) {
    console.error("Error in getProblemRecs:", error?.message ?? error);
    return res.status(500).json({ error: error?.message ?? String(error) });
  }
};

// get problems recommended
// GET /user/problem-recs
export const getRecommendedProblems = async (req, res) => {
  try {
    const { sub: id } = req?.user;
    const user = await User.findById(id)
      .select("currentRecommendation solvedProblems")
      .lean();

    if (!user || !Array.isArray(user.currentRecommendation)) {
      return res.status(404).json({
        success: false,
        code: "NO_RECS_INITIATED",
        message: "You have not requested recommendations yet.",
      });
    }

    if (user.currentRecommendation.length === 0) {
      return res.status(200).json({
        success: false,
        code: "NO_RECS_AVAILABLE",
        message: "No problems to recommend.",
      });
    }

    const getIdString = (x) => {
      if (x == null) return "";
      if (typeof x === "string" || typeof x === "number") return String(x);
      return String(x.id ?? x.problemId ?? x.slug ?? x._id ?? "");
    };

    let solvedSet = new Set();
    if (Array.isArray(user.solvedProblems) && user.solvedProblems.length > 0) {
      solvedSet = new Set(user.solvedProblems.map(getIdString));
    }

    let solvedCount = 0;
    const questionRecs = user.currentRecommendation.map((rec) => {
      const recId = getIdString(rec?.id ?? rec?.problemId ?? rec?.slug ?? rec);
      const isSolved = solvedSet.has(recId);
      if (isSolved) solvedCount++;
      return {
        ...rec,
        isSolved,
      };
    });

    const totalRecommended = questionRecs.length;
    const unsolvedCount = totalRecommended - solvedCount;

    return res.status(200).json({
      success: true,
      totalRecommended,
      solvedCount,
      unsolvedCount,
      count: totalRecommended,
      questionRecs,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching recommendations.",
      error: error.message,
    });
  }
};

// gets your current streak, works differently than your traditional streak counter
// if you submit the same question on two different days, only its latest submission will count
// this is the discourage people from copy pasting code to maintain streaks
// get /user/streak
export const getStreak = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;
    const user = await User.findById(id)
      .select("-_id solvedProblems failedProblems")
      .lean();

    const allDates = [];
    user.solvedProblems.forEach((p) => {
      if (p.lastSubmittedAt) allDates.push(new Date(p.lastSubmittedAt));
    });
    user.failedProblems.forEach((p) => {
      if (p.lastSubmittedAt) allDates.push(new Date(p.lastSubmittedAt));
    });
    if (allDates.length === 0) {
      return res.status(200).json({ currentStreak: 0 });
    }

    // Normalize to YYYY-MM-DD and get unique days
    const dateSet = new Set(allDates.map((d) => d.toISOString().split("T")[0]));

    const today = new Date();
    let streak = 0;

    for (let i = 0; ; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const key = checkDate.toISOString().split("T")[0];

      if (dateSet.has(key)) {
        streak++;
      } else {
        if (i === 0) streak = 0;
        break;
      }
    }

    res.status(200).json({ currentStreak: streak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
