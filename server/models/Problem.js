import { Schema, model } from "mongoose";

const ProblemSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    rating: { type: Number },
  },
  { timestamps: true }
);

export default model("Problem", ProblemSchema);
