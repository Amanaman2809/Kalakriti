// Test Route
import express from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { AuthenticatedRequest } from "../../middlewares/requireAuth";

const router = express.Router();

router.get("/", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

export default router;
