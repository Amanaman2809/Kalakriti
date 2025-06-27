import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import {
  AuthenticatedRequest,
  requireAdmin,
  requireAuth,
} from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// Fetch Orders
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Place Order
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

// Change Order Status -- Admin Only
router.put(
  "/:id/status",
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["PLACED", "SHIPPED", "DELIVERED"];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const currentIndex = allowedStatuses.indexOf(order.status);
    const newIndex = allowedStatuses.indexOf(status);

    if (newIndex < currentIndex) {
      res.status(400).json({ error: "Cannot downgrade status" });
      return;
    }

    try {
      const updated = await prisma.order.update({
        where: { id },
        data: { status },
      });

      res.json({ message: "Order status updated", order: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update order status" });
    }
  },
);

export default router;
