import { Schema, model } from "mongoose";
import SolvedProblemSchema from "./SolvedProblem";

const UserSchema = new Schema(
  {
    leetcodeUserName: {
      type: String,
      required: true,
      unique: true,
    },
    sessionToken: {
      type: String,
    },
    csrfToken: {
      type: String,
    },
    solvedProblems: [SolvedProblemSchema],
    totalProblemsSolved: {
      type: Number,
      default: 0,
    },
    averageRating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model("UserSchema", UserSchema);
