/**
 * Fetch all contests [add it to run-update scripts]
 * From individual contest page, figure out which API call gives the small green ticks
 * Use that call to get the questions solved for every person
 * Since this will be an expensive operation, keep appending this data on the user model as they look for it
 * This means, if a user search his past 10 contests solved, add those to his doc
 * Next time, we just return that doc. Similarly, if he searches for some new contest solve, hit the leetcode api
 * pay that one time cost & add it to the user model.
 *
 * Or while doing some neat data vis, pay this whole cost one time for once and for all
 * We can get the number of solves for the user from the profile page in the graph they use to show your performance
 * This API can also be useful
 *
 *
 * Flow:-
 * user asks contest data
 *    if no data:
 *        map his attended contests using profile page vis
 *        get the last 10 contests from that data
 *        also check the previous 2 contests [weekly/biweekly] because they are not updated frequently
 *        cache the result in the doc
 *    if data:
 *        return data
 */

import User from "../models/User.js";
import Problem from "../models/Problem.js";
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

    const totalCount = normalized.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const pageContests = normalized.slice(startIndex, endIndex);

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

    const CONCURRENCY = 10;

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
        startTime: new Date((c.startTime || 0) * 1000).toLocaleDateString(
          "en-US",
          {
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        ),
        totalCredits,
        earnedCredits,
        questions,
      };
    });

    return res.status(200).json({
      meta: {
        totalCount,
        totalPages,
        page,
        pageSize,
        returned: transformedContests.length,
      },
      contests: transformedContests,
    });
  } catch (err) {
    return next(err);
  }
};
