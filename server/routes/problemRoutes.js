import { Router } from "express";
import {
  getProblemTags,
  getSolvedProblems,
  rateManyProblems,
  rateOneProblem,
} from "../controllers/problemController.js";
import { verifyJwt } from "../middleware/verifyJwt.js";
const router = Router();

router.post("/rate", rateOneProblem);
router.post("/rate-batch", rateManyProblems);
router.get("/solved-problems", verifyJwt(), getSolvedProblems);
router.get("/tags", verifyJwt(), getProblemTags);

export default router;
