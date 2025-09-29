import express, { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { requireAuth, requireAdmin } from "../../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to convert paise to rupees
const paiseToRupees = (paise: number): number => paise / 100;

router.get(
  "/admin/stats",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const now = new Date();

      // start of week (Sunday 00:00) and month (1st day)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // shared filter = only real paid sales
      const paidOrdersFilter = {
        status: { not: "CANCELLED" },
        paymentStatus: "PAID",
      } as const;

      // overall
      const overall = await prisma.order.aggregate({
        where: paidOrdersFilter,
        _count: { id: true },
        _sum: { netAmount: true },
      });

      // monthly
      const monthly = await prisma.order.aggregate({
        where: { ...paidOrdersFilter, createdAt: { gte: startOfMonth } },
        _count: { id: true },
        _sum: { netAmount: true },
      });

      // weekly
      const weekly = await prisma.order.aggregate({
        where: { ...paidOrdersFilter, createdAt: { gte: startOfWeek } },
        _count: { id: true },
        _sum: { netAmount: true },
      });

      res.json({
        overall: {
          totalOrders: overall._count.id,
          totalRevenue: paiseToRupees(overall._sum.netAmount || 0),
        },
        monthly: {
          totalOrders: monthly._count.id,
          totalRevenue: paiseToRupees(monthly._sum.netAmount || 0),
        },
        weekly: {
          totalOrders: weekly._count.id,
          totalRevenue: paiseToRupees(weekly._sum.netAmount || 0),
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  },
);

export default router;
