import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getMyBookmarks, getMyBookmarkIds, toggleBookmark } from "../controllers/bookmarkController";

const router = Router();

router.get("/me", requireAuth, getMyBookmarks);
router.get("/me/ids", requireAuth, getMyBookmarkIds);
router.post("/subtopics/:subtopicId", requireAuth, toggleBookmark);

export default router;
