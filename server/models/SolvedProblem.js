import { Schema } from "mongoose";

const SolvedProblemSchema = new Schema(
  {
    problem: {
      type: String,
      ref: "Problem",
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
