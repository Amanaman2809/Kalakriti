import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { requireAuth } from "../middlewares/requireAuth";
import { transformProduct } from "../lib/productTransform";

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to convert paise to rupees
const paiseToRupees = (paise: number): number => {
  return paise / 100;
};

// User Cart (convert product prices from paise to rupees)
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      select: {
        id: true,
        quantity: true,
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            discountPct: true,
            price: true,
            stock: true,
            categoryId: true,
            tags: true,
            images: true,
            createdAt: true,
            updatedAt: true,
            averageRating: true, //  ADD THIS
            numReviews: true, // ADD THIS
            category: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Convert product prices from paise to rupees for frontend
    const itemsWithRupeePrices = items.map((item) => ({
      ...item,
      product: transformProduct(item.product),
    }));

    console.log(
      "Cart items with converted prices:",
      itemsWithRupeePrices.length,
    );
    res.json(itemsWithRupeePrices);
  } catch (err) {
    console.error("Cart fetch error:", err);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
});

// Add item to cart (increment quantity if exists)
router.post("/", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { productId, quantity } = req.body;
  if (!productId) return res.status(400).json({ error: "Invalid productId" });
  if (typeof quantity !== "number" || quantity < 1)
    return res.status(400).json({ error: "Invalid quantity" });

  try {
    // Fetch product and current cart item
    const [product, existingCartItem] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId } },
      }),
    ]);

    if (!product) return res.status(404).json({ error: "Product not found" });

    const currentQuantity = existingCartItem?.quantity || 0;
    const newQuantity = currentQuantity + quantity;

    if (newQuantity > product.stock) {
      return res
        .status(400)
        .json({ error: "Requested quantity exceeds available stock" });
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: { quantity: newQuantity },
      create: { userId, productId, quantity: newQuantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true, // paise
            stock: true,
            images: true,
          },
        },
      },
    });

    const responseItem = {
      ...item,
      product: {
        ...item.product,
        price: paiseToRupees(item.product.price),
      },
    };

    res.status(201).json(responseItem);
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ error: "Failed to add/update item" });
  }
});

// Delete item from cart (no price conversion needed)
router.delete("/", requireAuth, async (req, res) => {
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
      console.log("Removed item completely from cart:", productId);
    } else {
      // Update the quantity
      await prisma.cartItem.update({
        where: { userId_productId: { userId, productId } },
        data: { quantity: currentQuantity - quantityToRemove },
      });
      console.log("Updated cart item quantity:", {
        productId,
        oldQuantity: currentQuantity,
        newQuantity: currentQuantity - quantityToRemove,
      });
    }

    res.status(204).end();
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
});

// Move from cart to wishlist (no price conversion needed)
router.post("/moveWishlist", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { productId } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!productId) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!cartItem) {
      res.status(404).json({ error: "Item not found in cart" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Check for existing wishlist item
      const existingWishlistItem = await tx.wishlistItem.findUnique({
        where: { userId_productId: { userId, productId } },
      });

      if (!existingWishlistItem) {
        await tx.wishlistItem.create({
          data: { userId, productId },
        });
        console.log("Added to wishlist:", productId);
      } else {
        console.log("Item already in wishlist:", productId);
      }

      // Remove from cart
      await tx.cartItem.delete({
        where: { userId_productId: { userId, productId } },
      });
      console.log("Removed from cart:", productId);
    });

    res.status(204).end();
  } catch (err) {
    console.error("Move to wishlist error:", err);
    res.status(500).json({ error: "Failed to move item to wishlist" });
  }
});

export default router;
