import { Schema } from "mongoose";

const RecommendationSchema = new Schema({
  id: {
    type: String,
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
  rating: {
    type: Number,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Hard", "Medium", "Easy"],
    required: true,
  },
  tags: [String],
  matchedTags: [String],
  matchedWeightSum: {
    type: Number,
  },
  matchFraction: {
    type: Number,
  },
  weight: {
    type: Number,
  },
});

export default RecommendationSchema;
