import { Router } from "express";
import { setUserData } from "../controllers/userController.js";
const router = Router();

router.post("/data", setUserData);

export default router;
