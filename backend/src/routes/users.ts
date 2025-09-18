// backend/src/routes/users.ts
import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
