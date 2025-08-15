import { model, Schema } from "mongoose";
import ContestQuestionSchema from "./ContestQuestion.js";

const ContestSchema = new Schema({
  contestId: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  contestType: {
    type: String,
    enum: ["Weekly", "Biweekly"],
    required: true,
  },
  questions: [ContestQuestionSchema],
});

export default model("Contest", ContestSchema);
