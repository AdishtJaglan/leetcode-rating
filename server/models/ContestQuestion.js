import { Schema } from "mongoose";

const ContestQuestionSchema = new Schema(
  {
    problemId: {
      type: String,
      ref: "Problem",
      required: true,
    },
    questionId: {
      type: Number,
      required: true,
    },
    questionCredits: {
      type: Number,
      default: 1,
      required: true,
    },
  },
  { _id: false }
);

export default ContestQuestionSchema;
