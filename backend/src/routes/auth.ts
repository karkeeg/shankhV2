import { Router } from "express";
import { login, signup, getMe, logout } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.post("/signup", signup);
router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);

export default router;
