import { Schema, model } from "mongoose";

import SolvedProblemSchema from "./SolvedProblem.js";
import FailedProblemSchema from "./FailedProblem.js";
import RecommendationSchema from "./Recommendation.js";

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
    contestMetaData: {
      attendedContestsCount: {
        type: Number,

        default: null,
      },
      rating: {
        type: Number,
        default: null,
      },
      globalRanking: {
        type: Number,
        default: null,
      },
      topPercentage: {
        type: Number,
        default: null,
      },
      badges: [
        {
          name: { type: String },
        },
      ],
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
    failedProblems: [FailedProblemSchema],
    totalProblemsSolved: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    weakTopicsCache: {
      result: {
        type: Object,
      },
      lastCalculated: {
        type: Date,
      },
      submissionCount: {
        type: Number,
      },
    },
    recentRecommendationHistory: {
      type: [[String]],
      default: [],
    },
    currentRecommendation: [RecommendationSchema],
  },
  { timestamps: true }
);

export default model("User", UserSchema);
