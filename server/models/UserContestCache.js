import { Schema, model } from "mongoose";

const QuestionSchema = new Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    titleSlug: {
      type: String,
      default: "",
    },
    isAc: {
      type: Boolean,
      default: false,
    },
    credit: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const ContestEntrySchema = new Schema(
  {
    title: {
      type: String,
      default: "",
    },
    titleSlug: {
      type: String,
      required: true,
    },
    startTime: {
      type: Number,
      required: true,
    },
    attended: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: null,
    },
    ranking: {
      type: Number,
      default: null,
    },
    totalCredits: {
      type: Number,
      default: 0,
    },
    earnedCredits: {
      type: Number,
      default: 0,
    },
    questions: {
      type: [QuestionSchema],
      default: [],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const UserContestCacheSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    contests: {
      type: [ContestEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default model("UserContestCache", UserContestCacheSchema);
