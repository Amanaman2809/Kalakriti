import express,{Request} from "express";
import { PrismaClient } from "../generated/prisma/client";
import {requireAuth } from "../middlewares/requireAuth";
const router = express.Router();
const prisma = new PrismaClient();

// get user's wishlist
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            images: true,
          },
        },
      },
    });

    res.json(wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// add to wishlist
router.post("/", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { productId } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!productId) {
    res.status(400).json({ error: "Missing productId" });
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }, // existence check only
    });

    if (!product) {
      res.status(404).json({ error: "Product does not exist" });
      return;
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      res.status(409).json({ error: "Already in wishlist" });
      return;
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: { userId, productId },
    });

    res.status(201).json(wishlistItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
});

// remove from wishlist
router.delete(
  "/:productId",
  requireAuth,
  async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { productId } = req.params;
    if (!productId) {
      res.status(400).json({ error: "Product ID is required" });
      return;
    }

    try {
      await prisma.wishlistItem.delete({
        where: { userId_productId: { userId, productId } },
      });

      res.status(204).end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// move from wishlist to cart
router.put(
  "/:productId",
  requireAuth,
  async (req:Request, res) => {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!productId) {
      res.status(400).json({ error: "Missing product ID" });
      return;
    }

    try {
      await prisma.$transaction(async (tx) => {
        const wishlistItem = await tx.wishlistItem.findUnique({
          where: { userId_productId: { userId, productId } },
        });

        if (!wishlistItem) {
          throw new Error("NOT_FOUND");
        }

        await tx.cartItem.create({
          data: {
            userId,
            productId,
            quantity: 1,
          },
        });

        await tx.wishlistItem.delete({
          where: { userId_productId: { userId, productId } },
        });
      });

      res.status(204).end();
    } catch (err: any) {
      if (err.message === "NOT_FOUND") {
        res.status(404).json({ error: "Wishlist item not found" });
        return;
      }

      console.error(err);
      res.status(500).json({ error: "Failed to move item to cart" });
    }
  },
);

export default router;
