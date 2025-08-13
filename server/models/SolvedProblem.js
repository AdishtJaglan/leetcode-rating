import { Schema } from "mongoose";

const SolvedProblemSchema = new Schema(
  {
    problemId: {
      type: String,
      ref: "Problem",
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    lastSubmittedAt: {
      type: Date,
      required: true,
    },
    ratingAtSolve: {
      type: Number,
      required: true,
    },
    topicTags: [String],
  },
  { _id: false }
);

export default SolvedProblemSchema;
