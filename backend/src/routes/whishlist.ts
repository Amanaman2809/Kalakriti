import express, { Request } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { requireAuth } from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to convert paise to rupees
const paiseToRupees = (paise: number): number => {
  return paise / 100;
};

// ✅ get user's wishlist (convert prices from paise to rupees)
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
            price: true, // This is in paise from database
            stock: true,
            images: true,
          },
        },
      },
    });

    // ✅ Convert product prices from paise to rupees for frontend
    const wishlistWithRupeePrices = wishlist.map((item) => ({
      ...item,
      product: {
        ...item.product,
        price: paiseToRupees(item.product.price), // Convert paise to rupees
      },
    }));

    res.json(wishlistWithRupeePrices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// add to wishlist (no price conversion needed)
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

// remove from wishlist (no price conversion needed)
router.delete("/:productId", requireAuth, async (req, res) => {
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
});

// move from wishlist to cart (no price conversion needed)
router.put("/:productId", requireAuth, async (req: Request, res) => {
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

      // Check if item already exists in cart
      const existingCartItem = await tx.cartItem.findUnique({
        where: { userId_productId: { userId, productId } },
      });

      if (existingCartItem) {
        // Update quantity if already in cart
        await tx.cartItem.update({
          where: { userId_productId: { userId, productId } },
          data: { quantity: existingCartItem.quantity + 1 },
        });
      } else {
        // Create new cart item
        await tx.cartItem.create({
          data: {
            userId,
            productId,
            quantity: 1,
          },
        });
      }

      // Remove from wishlist
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
});

export default router;
