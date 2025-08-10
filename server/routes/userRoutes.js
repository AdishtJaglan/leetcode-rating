import { Router } from "express";
import { getDailySolves, setUserData } from "../controllers/userController.js";
import { verifyJwt } from "../middleware/verifyJwt.js";
const router = Router();

router.post("/data", setUserData);
router.get("/daily-solve", verifyJwt(), getDailySolves);

export default router;
