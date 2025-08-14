import { Schema, model } from "mongoose";

const ProblemSchema = new Schema(
  {
    //! frontend ID
    _id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    titleSlug: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      default: "",
    },
    isPaidOnly: {
      type: Boolean,
      default: false,
    },
    topicTags: [
      {
        name: { type: String },
        slug: { type: String },
      },
    ],
    rating: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default model("Problem", ProblemSchema);
