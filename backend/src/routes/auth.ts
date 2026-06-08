import { Router } from "express";
import { login, signup, getMe, logout, updateProfile, changePassword, onboard } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.post("/signup", signup);
router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);
router.patch("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);
router.post("/onboard", requireAuth, onboard);

export default router;
