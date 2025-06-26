import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { requireAuth } from "../middlewares/requireAuth";
import { AuthenticatedRequest } from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// User Cart
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  res.json(items);
});

// Add item to cart
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { productId, quantity } = req.body;

  if (!productId) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }

  if (typeof quantity !== "number" || quantity < 1) {
    res.status(400).json({ error: "Invalid quantity" });
    return;
  }

  // Check product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // Check if requested quantity exceeds available stock
  if (quantity > product.stock) {
    res
      .status(400)
      .json({ error: "Requested quantity exceeds available stock" });
    return;
  }

  try {
    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: { quantity },
      create: { userId, productId, quantity },
    });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add/update item" });
  }
});

// Delete item from cart
router.delete("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { productId, quantityToRemove } = req.body;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!productId) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }

  if (typeof quantityToRemove !== "number" || quantityToRemove < 1) {
    res.status(400).json({ error: "Invalid quantity to remove" });
    return;
  }

  try {
    // Find the current cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!cartItem) {
      res.status(404).json({ error: "Item not found in cart" });
      return;
    }

    const currentQuantity = cartItem.quantity;

    if (quantityToRemove >= currentQuantity) {
      // Remove the item completely
      await prisma.cartItem.delete({
        where: { userId_productId: { userId, productId } },
      });
    } else {
      // Update the quantity
      await prisma.cartItem.update({
        where: { userId_productId: { userId, productId } },
        data: { quantity: currentQuantity - quantityToRemove },
      });
    }

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
});

export default router;
