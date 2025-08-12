import { Types } from "mongoose";
import Problem from "../models/Problem.js";
import User from "../models/User.js";

// POST /problem/rate
// send problem ID to get its rating
export const rateOneProblem = async (req, res, next) => {
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
};

// POST /problem/rate-batch
// send bunch of problem IDs to get their corresponding ratings
export const rateManyProblems = async (req, res, next) => {
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
};

// GET /problem/solved-problems
// get a list of recently solved problems [supports pagination]
export const getSolvedProblems = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit || "20", 10))
    );
    const skip = (page - 1) * limit;

    const agg = await User.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      { $project: { count: { $size: { $ifNull: ["$solvedProblems", []] } } } },
    ]);
    const totalCount = (agg[0] && agg[0].count) || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const user = await User.findById(id)
      .select("solvedProblems")
      .slice("solvedProblems", [skip, limit])
      .populate("solvedProblems.problemId", "title")
      .lean();

    const solvedProblems = (user?.solvedProblems || []).map((sp) => ({
      problemId: sp.problemId?._id ?? sp.problemId,
      title: sp.problemId?.title,
      difficulty: sp.difficulty,
      lastSubmittedAt: sp.lastSubmittedAt,
      ratingAtSolve: sp.ratingAtSolve,
      topicTags: sp.topicTags,
    }));

    return res.status(200).json({
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      data: solvedProblems,
    });
  } catch (error) {
    return res.status(500).json({ message: "boom", error: error?.message });
  }
};

// GET /problem/tags
// get a list of topic tags pertaining to the questions solved by the user
export const getProblemTags = async (req, res, next) => {
  try {
    const { sub: id } = req?.user;

    const agg = await User.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      { $project: { solvedProblems: 1 } },
      { $unwind: "$solvedProblems" },
      { $unwind: "$solvedProblems.topicTags" },
      {
        $group: {
          _id: { $toLower: "$solvedProblems.topicTags" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const tagCounts = (agg || []).reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    return res.status(200).json({ data: tagCounts });
  } catch (error) {
    return res.status(500).json({ message: "boom", error: error?.message });
  }
};
