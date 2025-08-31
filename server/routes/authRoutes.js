import { Router } from "express";
import {
  linkAccount,
  login,
  logout,
  refreshAuth,
  verifySessionAndCsrfTokens,
} from "../controllers/authController.js";
const router = Router();

router.post("/verify-leetcode", verifySessionAndCsrfTokens);
router.post("/link", linkAccount);
router.post("/login", login);
router.post("/refresh", refreshAuth);
router.post("/logout", logout);

export default router;
