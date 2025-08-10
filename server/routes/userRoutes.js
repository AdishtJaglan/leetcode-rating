import { Router } from "express";
import {
  getActiveHours,
  getDailySolveRating,
  getDailySolves,
  getDifficultyDist,
  getRatingDist,
  setUserData,
} from "../controllers/userController.js";
import { verifyJwt } from "../middleware/verifyJwt.js";
const router = Router();

router.post("/data", setUserData);
router.get("/daily-solve", verifyJwt(), getDailySolves);
router.get("/active-hours", verifyJwt(), getActiveHours);
router.get("/difficulty-dist", verifyJwt(), getDifficultyDist);
router.get("/rating-dist", verifyJwt(), getRatingDist);
router.get("/rating-daily", verifyJwt(), getDailySolveRating);

export default router;
