import Problem from "../models/Problem.js";

export const rateOneProblem = async (req, res) => {
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

export const rateManyProblems = async (req, res) => {
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
