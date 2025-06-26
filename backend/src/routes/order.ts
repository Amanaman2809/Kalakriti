import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { AuthenticatedRequest, requireAuth } from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { address } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!address || typeof address !== "string") {
    res.status(400).json({ error: "Invalid address" });
    return;
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (!cartItems || cartItems.length === 0) {
    res.status(400).json({ error: "No items in cart" });
    return;
  }

  const total = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0,
  );

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const createdOrder = await tx.order.create({
        data: {
          userId,
          status: "PLACED",
          total,
          address,
        },
      });

      // Create order items
      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          },
        });

        // Deduct Stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return createdOrder;
    });
    res.status(201).json({ message: "Order Placed Successfully", order });
  } catch (error) {
    res.status(500).json({ error: "Failed to place order" });
  }
});

export default router;
