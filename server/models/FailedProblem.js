import { Schema } from "mongoose";

const FailedProblemSchema = new Schema(
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
    ratingAtAttempt: {
      type: Number,
      required: true,
    },
    topicTags: [String],
    numSubmitted: {
      type: Number,
      default: 1,
    },
    lastResult: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

export default FailedProblemSchema;
