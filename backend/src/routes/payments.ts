import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import {
  // AuthenticatedRequest,
  requireAdmin,
  requireAuth,
} from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get store credit balance for logged-in user
import { Request, Response } from "express";

router.get(
  "/store-credits",
  requireAuth,
  async (req: Request, res: Response) => {
    const userId = req.body.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    try {
      const credits = await prisma.storeCredit.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const now = new Date();
      const activeCredits = credits.filter(
        (c) => !c.expiresAt || c.expiresAt > now,
      );
      const balance = activeCredits.reduce((sum, c) => sum + c.amount, 0);

      res.json({ balance, credits: activeCredits });
    } catch (err) {
      console.error("Failed to fetch store credit:", err);
      res.status(500).json({ error: "Failed to fetch store credit" });
    }
  },
);

export default router;
