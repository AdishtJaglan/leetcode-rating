import { Schema, model } from "mongoose";
import SolvedProblemSchema from "./SolvedProblem.js";

const UserSchema = new Schema(
  {
    leetcodeUserName: {
      type: String,
      required: true,
      unique: true,
    },
    leetcodeAvatar: {
      type: String,
    },
    leetcodeSubmissions: [
      {
        difficulty: String,
        count: Number,
        submissions: Number,
      },
    ],
    sessionToken: {
      type: String,
    },
    csrfToken: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
    },
    localAuthEnabled: {
      type: Boolean,
      default: false,
    },
    passwordSetAt: {
      type: Date,
    },
    authMethods: {
      type: [String],
      default: ["leetcode"],
    },
    refreshTokenHash: {
      type: String,
    },
    refreshTokenExpiry: {
      type: Date,
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

export default model("User", UserSchema);
