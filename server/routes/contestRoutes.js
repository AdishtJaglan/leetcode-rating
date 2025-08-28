import { Router } from "express";
import { verifyJwt } from "../middleware/verifyJwt.js";
import {
  getAverageRatingsByQuestionNumber,
  getContestSolves,
  getFrequentlyAskedTopics,
  getTopicFrequencyByQuestionNumber,
} from "../controllers/contestController.js";
const router = Router();

router.get("/solves", verifyJwt(), getContestSolves);
router.get("/frequent-topics", getFrequentlyAskedTopics);
router.get("/frequent-ques-topics", getTopicFrequencyByQuestionNumber);
router.get("/rating-average", getAverageRatingsByQuestionNumber);

export default router;
