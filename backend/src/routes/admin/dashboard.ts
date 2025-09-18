import express, { Request, Response } from "express";
import { Prisma, PrismaClient } from "../../generated/prisma/client";
import { requireAuth, requireAdmin } from "../../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/admin/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();

    // start of week (Sunday 00:00) and month (1st day)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // overall
    const overall = await prisma.order.aggregate({
      _count: { id: true },
      _sum: { netAmount: true },
    });

    // monthly
    const monthly = await prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _count: { id: true },
      _sum: { netAmount: true },
    });

    // weekly
    const weekly = await prisma.order.aggregate({
      where: { createdAt: { gte: startOfWeek } },
      _count: { id: true },
      _sum: { netAmount: true },
    });

    res.json({
      overall: {
        totalOrders: overall._count.id,
        totalSum: overall._sum.netAmount || 0,
      },
      monthly: {
        totalOrders: monthly._count.id,
        totalSum: monthly._sum.netAmount || 0,
      },
      weekly: {
        totalOrders: weekly._count.id,
        totalSum: weekly._sum.netAmount || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
