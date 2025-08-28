import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import Problem from "../models/Problem.js";

const MONGO_URI = "mongodb://localhost:27017/flipgame";
const OUT_FILE = path.resolve(process.cwd(), "tagAverages.json");

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return NaN;
  const idx = (sortedArr.length - 1) * p;
  const lo = Math.floor(idx),
    hi = Math.ceil(idx);
  if (lo === hi) return sortedArr[lo];
  const w = idx - lo;
  return sortedArr[lo] * (1 - w) + sortedArr[hi] * w;
}

function mean(arr) {
  if (arr.length === 0) return NaN;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr) {
  if (arr.length === 0) return NaN;
  const mu = mean(arr);
  const v = arr.reduce((s, x) => s + (x - mu) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}

function median(sortedArr) {
  if (sortedArr.length === 0) return NaN;
  const mid = Math.floor(sortedArr.length / 2);
  return sortedArr.length % 2 === 1
    ? sortedArr[mid]
    : (sortedArr[mid - 1] + sortedArr[mid]) / 2;
}

function winsorizedMean(arr, lowPct = 0.05, highPct = 0.95) {
  if (arr.length === 0) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const low = percentile(s, lowPct);
  const high = percentile(s, highPct);
  const capped = s.map((x) => (x < low ? low : x > high ? high : x));
  return mean(capped);
}

const func = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const problems = await Problem.find({}, "topicTags rating").lean();

    const ratingsByTag = Object.create(null);
    let globalSum = 0,
      globalCount = 0;

    problems.forEach((p) => {
      const r = Number(p?.rating);
      const hasRating = Number.isFinite(r);
      if (!Array.isArray(p.topicTags)) return;

      p.topicTags.forEach((t) => {
        const key =
          typeof t === "string"
            ? t
            : t && typeof t.name === "string"
            ? t.name
            : JSON.stringify(t);
        if (!key || key === "null" || key === "undefined") return;

        if (!ratingsByTag[key]) ratingsByTag[key] = [];
        if (hasRating) {
          ratingsByTag[key].push(r);
          globalSum += r;
          globalCount += 1;
        }
      });
    });

    const globalMean = globalCount > 0 ? globalSum / globalCount : 0;

    const winsorPct = 0.1; // 0.1 because our dataset is hella noisy
    const bayesM = 10;

    // Compute per-tag metrics and final shrunk score
    const finalObj = Object.create(null);
    for (const [tag, arr] of Object.entries(ratingsByTag)) {
      const sorted = [...arr].sort((a, b) => a - b);
      const cnt = arr.length;
      const mu = mean(arr);
      const med = median(sorted);
      const sd = stddev(arr);
      const winMean = winsorizedMean(arr, winsorPct, 1 - winsorPct);
      // Bayesian shrinkage toward global mean using winsorized mean as observation
      const shrunk =
        (cnt / (cnt + bayesM)) * (Number.isFinite(winMean) ? winMean : mu) +
        (bayesM / (cnt + bayesM)) * globalMean;

      // Also compute IQR and outlier bounds (for diagnostics)
      const q1 = percentile(sorted, 0.25);
      const q3 = percentile(sorted, 0.75);
      const iqr = q3 - q1;
      const outLow = q1 - 1.5 * iqr;
      const outHigh = q3 + 1.5 * iqr;
      const outlierCount = sorted.filter(
        (x) => x < outLow || x > outHigh
      ).length;

      finalObj[tag] = {
        count: cnt,
        mean: Number.isFinite(mu) ? +mu.toFixed(4) : null,
        median: Number.isFinite(med) ? +med.toFixed(4) : null,
        stddev: Number.isFinite(sd) ? +sd.toFixed(4) : null,
        winsorizedMean: Number.isFinite(winMean) ? +winMean.toFixed(4) : null,
        iqr,
        outlierCount,
        score: Number.isFinite(shrunk) ? +(shrunk / 100).toFixed(6) : null,
        method: "bayes_winsorized",
      };
    }

    await fs.writeFile(OUT_FILE, JSON.stringify(finalObj, null, 2), "utf8");
    console.log("Wrote tag scores to:", OUT_FILE);
  } catch (error) {
    console.error("Error in DB operation:", error);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
      console.log("Disconnected");
    } catch (e) {
      console.error("Error disconnecting:", e);
    }
  }
};

func().catch((e) => console.error("Unhandled error:", e));
