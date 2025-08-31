import User from "../models/User.js";
import Problem from "../models/Problem.js";
import UserContestCache from "../models/UserContestCache.js";
import Contest from "../models/Contest.js";
import {
  fetchContestQuestions,
  getAttendedContests,
} from "../utils/contestHelper.js";

export const getContestSolves = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;
    const user = await User.findById(id)
      .select("leetcodeUserName sessionToken csrfToken -_id")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.max(1, parseInt(req.query.pageSize || "10", 10));
    const forceRefresh =
      String(
        req.query.forceRefresh || req.query.hardRefresh || ""
      ).toLowerCase() === "true";

    const TTL_MS = 7 * 24 * 60 * 60 * 1000;

    let cache = await UserContestCache.findOne({ userId: id }).lean();

    const isCacheFresh = (cache) => {
      if (!cache || !cache.lastUpdated) return false;
      return Date.now() - new Date(cache.lastUpdated).getTime() < TTL_MS;
    };

    // If cache exists and is fresh and not forcing refresh -> return paginated cached contests
    if (!forceRefresh && cache && isCacheFresh(cache)) {
      const totalCount =
        (Array.isArray(cache.contests) && cache.contests.length) || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, totalCount);
      const pageContests = (cache.contests || []).slice(startIndex, endIndex);

      return res.status(200).json({
        meta: {
          totalCount,
          totalPages,
          page,
          pageSize,
          returned: pageContests.length,
          cache: { used: true, stale: false, lastUpdated: cache.lastUpdated },
        },
        contests: pageContests,
      });
    }

    // Otherwise: we need to (re)build the data for this user.
    // We'll attempt to refresh inline. If refresh fails and we have stale cache,
    // we will return the stale cache + warning.

    async function buildTransformedContests() {
      // 1) fetch attended contests metadata
      const attendedContest = await getAttendedContests({
        sessionCookie: user.sessionToken,
        csrfToken: user.csrfToken,
        username: user.leetcodeUserName,
      });

      const slugify = (str = "") =>
        String(str)
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "");

      const normalized = Array.isArray(attendedContest)
        ? attendedContest.map((entry) => {
            const title = entry?.contest?.title ?? "";
            return {
              ...entry,
              titleSlug: slugify(title),
              startTime: Number(entry?.contest?.startTime ?? 0),
            };
          })
        : [];

      normalized.sort((a, b) => {
        if (b.startTime !== a.startTime) return b.startTime - a.startTime;
        if (b.titleSlug && a.titleSlug)
          return b.titleSlug.localeCompare(a.titleSlug);
        return 0;
      });

      // fetch per-contest questions concurrently with limited concurrency
      async function parallelLimit(items, limit, handler) {
        const results = new Array(items.length);
        let i = 0;
        async function worker() {
          while (true) {
            const idx = i++;
            if (idx >= items.length) return;
            try {
              results[idx] = await handler(items[idx], idx);
            } catch (err) {
              results[idx] = {
                __error: true,
                message: err?.message ?? String(err),
                stack: err?.stack,
              };
            }
          }
        }
        const workers = Array(Math.min(limit, items.length))
          .fill(0)
          .map(() => worker());
        await Promise.all(workers);
        return results;
      }

      const CONCURRENCY = Number(process.env.CONTEST_FETCH_CONCURRENCY) || 6;
      const fetchHandler = async (contest) => {
        try {
          const q = await fetchContestQuestions({
            sessionCookie: user.sessionToken,
            csrfToken: user.csrfToken,
            contestSlug: contest.titleSlug,
          });
          return q;
        } catch (err) {
          return { __error: true, message: err?.message ?? "fetch error" };
        }
      };

      const pageContests = normalized;

      const fetchResults = await parallelLimit(
        pageContests,
        CONCURRENCY,
        fetchHandler
      );

      const questionsBySlug = {};
      pageContests.forEach((c, idx) => {
        questionsBySlug[c.titleSlug] = fetchResults[idx];
      });

      const questionIdSet = new Set();
      Object.values(questionsBySlug).forEach((arr) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((q) => {
          if (!q || q.__error) return;
          const qid = q.questionId ?? q.question_id ?? q.id ?? null;
          if (qid !== undefined && qid !== null && String(qid).trim() !== "") {
            questionIdSet.add(String(qid));
          }
        });
      });

      let problemRatingMap = {};
      if (questionIdSet.size > 0) {
        const ids = Array.from(questionIdSet);
        const problems = await Problem.find({ questionId: { $in: ids } })
          .select("questionId rating -_id")
          .lean();
        problemRatingMap = problems.reduce((m, p) => {
          if (!p) return m;
          m[String(p.questionId)] = p.rating ?? null;
          return m;
        }, {});
      }

      const transformedContests = pageContests.map((c) => {
        const slug = c.titleSlug;
        const rawQuestions = questionsBySlug[slug];

        const validQuestions = Array.isArray(rawQuestions)
          ? rawQuestions.filter((q) => q && !q.__error)
          : [];

        const questions = validQuestions.map((q) => {
          const qid = String(q.questionId ?? q.question_id ?? q.id ?? "");
          const creditVal = Number(q.credit ?? q.credits ?? 0) || 0;
          return {
            isAc: !!q.isAc,
            credit: creditVal,
            title: q.title ?? "",
            titleSlug: q.titleSlug ?? "",
            questionId: qid,
            rating: qid ? problemRatingMap[qid] ?? null : null,
          };
        });

        const totalCredits = questions.reduce(
          (sum, q) => sum + (Number(q.credit) || 0),
          0
        );
        const earnedCredits = questions.reduce(
          (sum, q) => sum + (q.isAc ? 1 : 0) * (Number(q.credit) || 0),
          0
        );

        return {
          attended: !!c.attended,
          rating: c.rating,
          ranking: c.ranking,
          title: c.contest?.title ?? "",
          titleSlug: slug,
          startTime: Number(c.startTime || 0),
          totalCredits,
          earnedCredits,
          questions,
          lastUpdated: new Date(), // per-contest refresh time
        };
      });

      return transformedContests;
    }

    let transformedContests;
    try {
      transformedContests = await buildTransformedContests();
    } catch (err) {
      // Refresh failed. If we have a stale cache, return cache with stale flag + warning.
      if (cache && Array.isArray(cache.contests)) {
        const totalCount = cache.contests.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalCount);
        const pageContests = cache.contests.slice(startIndex, endIndex);

        return res.status(200).json({
          meta: {
            totalCount,
            totalPages,
            page,
            pageSize,
            returned: pageContests.length,
            cache: { used: true, stale: true, lastUpdated: cache.lastUpdated },
            warning: "Refresh failed; returning stale cached data.",
            refreshError: err?.message ?? String(err),
          },
          contests: pageContests,
        });
      }
      // no cache to fall back to — rethrow
      throw err;
    }

    await UserContestCache.findOneAndUpdate(
      { userId: id },
      { userId: id, contests: transformedContests, lastUpdated: new Date() },
      { upsert: true }
    );

    const totalCount = transformedContests.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const pageContests = transformedContests.slice(startIndex, endIndex);

    const formattedPageContests = pageContests.map((c) => ({
      ...c,
      startTime: new Date(c.startTime * 1000).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    }));

    return res.status(200).json({
      meta: {
        totalCount,
        totalPages,
        page,
        pageSize,
        returned: formattedPageContests.length,
        cache: { used: false, stale: false, refreshedAt: new Date() },
      },
      contests: formattedPageContests,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching user contest data.",
      error: error?.message,
    });
  }
};

// quickly get a list of topics asked in last couple contest
// can ask for more contest using query param limit
export const getFrequentlyAskedTopics = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 10);

    const pipeline = [
      { $sort: { startTime: -1, _id: -1 } },
      { $limit: limit },
      { $project: { questions: 1 } },
      { $unwind: "$questions" },
      {
        $lookup: {
          from: "problems",
          localField: "questions.problemId",
          foreignField: "_id",
          as: "problem",
        },
      },
      { $unwind: { path: "$problem", preserveNullAndEmptyArrays: false } },
      {
        $unwind: {
          path: "$problem.topicTags",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$problem.topicTags.slug",
          name: { $first: "$problem.topicTags.name" },
          count: { $sum: 1 },
        },
      },
      { $project: { slug: "$_id", name: 1, count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ];

    const topicCounts = await Contest.aggregate(pipeline).exec();
    return res.status(200).json({ topicCounts });
  } catch (error) {
    console.error("Agg error:", error?.message);
    return res.status(500).json({ message: "error", error: error?.message });
  }
};

// get a detailed list of which topic is asked most in each question
// can ask for more contest using query param limit
export const getTopicFrequencyByQuestionNumber = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 10);
    const ignoreParam = (req.query.ignore ?? "array")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const pipeline = [
      { $sort: { startTime: -1, _id: -1 } },
      ...(limit > 0 ? [{ $limit: limit }] : []),
      { $project: { questions: 1 } },
      { $unwind: { path: "$questions", includeArrayIndex: "qIndex" } },
      { $match: { qIndex: { $in: [0, 1, 2, 3] } } },
      {
        $lookup: {
          from: "problems",
          localField: "questions.problemId",
          foreignField: "_id",
          as: "problem",
        },
      },
      { $unwind: { path: "$problem", preserveNullAndEmptyArrays: false } },
      {
        $unwind: {
          path: "$problem.topicTags",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $addFields: {
          tagKey: {
            $toLower: {
              $ifNull: ["$problem.topicTags.slug", "$problem.topicTags.name"],
            },
          },
          tagName: "$problem.topicTags.name",
          tagSlug: "$problem.topicTags.slug",
        },
      },
      ...(ignoreParam.length
        ? [{ $match: { tagKey: { $nin: ignoreParam } } }]
        : []),
      {
        $group: {
          _id: { tagKey: "$tagKey", qIndex: "$qIndex" },
          name: { $first: "$tagName" },
          slug: { $first: "$tagSlug" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.tagKey",
          name: { $first: "$name" },
          slug: { $first: "$slug" },
          total: { $sum: "$count" },
          q0: { $sum: { $cond: [{ $eq: ["$_id.qIndex", 0] }, "$count", 0] } },
          q1: { $sum: { $cond: [{ $eq: ["$_id.qIndex", 1] }, "$count", 0] } },
          q2: { $sum: { $cond: [{ $eq: ["$_id.qIndex", 2] }, "$count", 0] } },
          q3: { $sum: { $cond: [{ $eq: ["$_id.qIndex", 3] }, "$count", 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          slug: { $ifNull: ["$slug", "$_id"] },
          name: 1,
          total: 1,
          perQuestion: {
            1: { $ifNull: ["$q0", 0] },
            2: { $ifNull: ["$q1", 0] },
            3: { $ifNull: ["$q2", 0] },
            4: { $ifNull: ["$q3", 0] },
          },
        },
      },
      { $sort: { total: -1 } },
    ];

    const topics = await Contest.aggregate(pipeline).exec();
    return res.status(200).json({ topics });
  } catch (error) {
    console.error("Error in getTopicTotalsWithPerQuestion:", error?.message);
    return res.status(500).json({ message: "error", error: error?.message });
  }
};

// get the average rating of each question [1,2,3,4] asked in contests
// query param limit to tweak the number of contests asked
export const getAverageRatingsByQuestionNumber = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 10);

    const pipeline = [
      { $sort: { startTime: -1 } },
      { $limit: limit },
      { $unwind: { path: "$questions", includeArrayIndex: "questionIndex" } },
      {
        $lookup: {
          from: "problems",
          localField: "questions.problemId",
          foreignField: "_id",
          as: "problemData",
          pipeline: [{ $project: { rating: 1 } }],
        },
      },
      {
        $match: {
          "problemData.rating": { $exists: true, $ne: null, $type: "number" },
        },
      },
      {
        $group: {
          _id: "$questionIndex",
          count: { $sum: 1 },
          sum: { $sum: { $arrayElemAt: ["$problemData.rating", 0] } },
          sumOfSquares: {
            $sum: {
              $pow: [{ $arrayElemAt: ["$problemData.rating", 0] }, 2],
            },
          },
        },
      },
      {
        $project: {
          questionNumber: { $add: ["$_id", 1] },
          average: { $divide: ["$sum", "$count"] },
          stdDev: {
            $sqrt: {
              $subtract: [
                { $divide: ["$sumOfSquares", "$count"] },
                { $pow: [{ $divide: ["$sum", "$count"] }, 2] },
              ],
            },
          },
          count: 1,
        },
      },
      { $sort: { questionNumber: 1 } },
    ];

    const results = await Contest.aggregate(pipeline);

    const ratingsStats = results.reduce((acc, item) => {
      acc[item.questionNumber] = {
        average: Math.round(item.average * 100) / 100,
        stdDev: Math.round(item.stdDev * 100) / 100,
      };
      return acc;
    }, {});

    return res.status(200).json({ ratingsStats });
  } catch (error) {
    console.error(
      "Error calculating average ratings by question index:",
      error.message
    );
    return res.status(500).json({
      message: "Failed to calculate rating statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
