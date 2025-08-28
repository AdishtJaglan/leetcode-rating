import { Router } from "express";
import { verifyJwt } from "../middleware/verifyJwt.js";
import { getContestSolves } from "../controllers/contestController.js";
const router = Router();

router.get("/solves", verifyJwt(), getContestSolves);

export default router;
