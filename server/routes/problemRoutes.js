import { Router } from "express";
import {
  rateManyProblems,
  rateOneProblem,
} from "../controllers/problemController.js";
const router = Router();

router.post("/rate", rateOneProblem);
router.post("/rate-batch", rateManyProblems);

export default router;
