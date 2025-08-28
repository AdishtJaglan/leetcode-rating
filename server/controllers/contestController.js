import User from "../models/User.js";
import Problem from "../models/Problem.js";
import UserContestCache from "../models/UserContestCache.js";
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
