import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { AuthenticatedRequest, requireAuth } from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// get user's wishlist
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: userId },
      include: { product: true },
    });

    res.json(wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// add to wishlist
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { productId } = req.body;
  if (!productId) {
    res.status(400).json({ error: "Missing product ID" });
    return;
  }

  try {
    const wishlistItem = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });

    res.json(wishlistItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// remove from wishlist
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: "Missing wishlist item ID" });
    return;
  }

  try {
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId, productId: id } },
    });

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
