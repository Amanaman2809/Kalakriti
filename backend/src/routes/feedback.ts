// routes/feedback.ts
import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { requireAuth } from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/products/:id/feedback", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const productId = req.params.id;
  const { rating, comment } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5" });
    return;
  }

  try {
    const existing = await prisma.feedback.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    let feedback;
    if (existing) {
      feedback = await prisma.feedback.update({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        data: { rating, comment },
      });
    } else {
      feedback = await prisma.feedback.create({
        data: { rating, comment, userId, productId },
      });
    }

    // Recalculate aggregate stats
    const stats = await prisma.feedback.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    // Update the product’s denormalized fields
    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: stats._avg.rating ?? 0,
        numReviews: stats._count._all,
      },
    });

    res.status(200).json({ message: "Feedback saved", feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id/feedbacks", async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = 10;

  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true } }, // show reviewer name
      },
    });

    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
});

router.get("/products/:id/feedback-summary", async (req, res) => {
  const { id } = req.params;

  try {
    const stats = await prisma.feedback.aggregate({
      where: { productId: id },
      _avg: { rating: true },
      _count: { _all: true },
    });

    res.json({
      avg_rating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
      total_reviews: stats._count._all,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get feedback summary" });
  }
});

export default router;
