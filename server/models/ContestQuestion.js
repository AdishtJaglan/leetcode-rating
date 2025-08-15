import { Schema } from "mongoose";

const ContestQuestionSchema = new Schema(
  {
    problem: {
      type: String,
      ref: "Problem",
      required: true,
    },
    questionId: {
      type: Number,
      required: true,
    },
    questionPoints: {
      type: Number,
      default: 1,
      required: true,
    },
    questionNumber: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

export default ContestQuestionSchema;
