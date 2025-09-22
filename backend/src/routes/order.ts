import express from "express";
import { OrderStatus, PrismaClient } from "../generated/prisma/client";
import {
  // AuthenticatedRequest,
  requireAdmin,
  requireAuth,
} from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// for admin
router.get("/admin", requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true } },
        address: true,
      },
    });
    // console.log(orders);
    res.json({ orders: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Fetch Orders
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
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
        address: true, // Include address details
      },
    });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Place Order
router.post("/", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { addressId, paymentMode } = req.body;

  if (!["COD", "ONLINE"].includes(paymentMode)) {
    return res.status(400).json({ error: "Invalid payment mode" });
  }

  try {
    // 1. Load cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
    if (!cartItems.length)
      return res.status(400).json({ error: "Cart is empty" });

    const grossAmount = cartItems.reduce(
      (s, it) => s + it.product.price * it.quantity,
      0,
    );
    const shippingAmount = grossAmount >= 99900 ? 0 : 9900; // example: ₹99 = 9900 paise
    const taxAmount = Math.round(grossAmount * 0.18);

    const grossPlusExtras = grossAmount + shippingAmount + taxAmount;

    // 2. Fetch available store credits
    const now = new Date();
    const credits = await prisma.storeCredit.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        amount: { gt: 0 },
      },
      orderBy: { createdAt: "asc" },
    });

    let availableCredit = credits.reduce((s, c) => s + c.amount, 0);

    let creditsToApply = 0;
    let orderCreditsToCreate: { storeCreditId: string; amount: number }[] = [];

    if (availableCredit > 0) {
      creditsToApply = Math.min(availableCredit, grossPlusExtras);
      let remainingToUse = creditsToApply;
      for (const c of credits) {
        if (remainingToUse <= 0) break;
        const usable = Math.min(c.amount, remainingToUse);
        orderCreditsToCreate.push({ storeCreditId: c.id, amount: usable });
        remainingToUse -= usable;
      }
    }

    const netAmount = grossPlusExtras - creditsToApply;

    // 3. Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          addressId,
          paymentMode,
          paymentStatus: netAmount === 0 ? "PAID" : "PENDING",
          status: "PLACED",
          grossAmount,
          shippingAmount,
          taxAmount,
          creditsApplied: creditsToApply,
          netAmount,
          items: {
            create: cartItems.map((ci) => ({
              productId: ci.productId,
              quantity: ci.quantity,
              price: ci.product.price,
            })),
          },
        },
      });

      // Decrement stock
      await Promise.all(
        cartItems.map((ci) =>
          tx.product.update({
            where: { id: ci.productId },
            data: { stock: { decrement: ci.quantity } },
          }),
        ),
      );

      // Create OrderCredit entries
      for (const c of orderCreditsToCreate) {
        await tx.orderCredit.create({
          data: {
            orderId: createdOrder.id,
            storeCreditId: c.storeCreditId,
            amount: c.amount,
          },
        });
      }

      if (creditsToApply > 0) {
        // Negative ledger entry for clarity
        await tx.storeCredit.create({
          data: {
            userId,
            amount: -creditsToApply,
            reason: `Consumed for order ${createdOrder.id}`,
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      // Create Payment record if fully covered by credit
      if (netAmount === 0) {
        await tx.payment.create({
          data: {
            orderId: createdOrder.id,
            userId,
            provider: "INTERNAL",
            providerPaymentId: null,
            amount: 0,
            status: "PAID",
          },
        });
      }

      return createdOrder;
    });

    // If ONLINE payment required, return client-side info
    if (paymentMode === "ONLINE" && netAmount > 0) {
      return res.status(200).json({
        message: "Order placed successfully. Payment required",
        orderId: order.id,
        netAmount,
        requiresPayment: true,
      });
    }

    return res
      .status(201)
      .json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Order placement failed:", error);
    return res.status(500).json({ error: "Failed to place order" });
  }
});

// Cancel Order
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { reason } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        orderCredits: true,
        payments: true,
      },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== userId)
      return res
        .status(403)
        .json({ error: "Unauthorized to cancel this order" });
    if (order.status !== "PLACED")
      return res
        .status(400)
        .json({ error: "Only 'PLACED' orders can be cancelled" });

    const hoursDiff =
      (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24)
      return res.status(400).json({ error: "Cancellation window expired" });

    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Update order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason || "Cancelled by customer",
          statusUpdatedAt: new Date(),
          paymentStatus:
            order.paymentMode === "ONLINE" && order.paymentStatus === "PAID"
              ? "REFUNDED"
              : order.paymentStatus,
        },
        include: {
          items: { include: { product: true } },
          address: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      // Restore stock
      await Promise.all(
        order.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          }),
        ),
      );

      // Restore store credits used
      for (const oc of order.orderCredits) {
        await tx.storeCredit.create({
          data: {
            userId: order.userId,
            amount: oc.amount,
            reason: `Refund for cancelled order ${order.id}`,
          },
        });

        await tx.refund.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            method: "STORE_CREDIT",
            amount: oc.amount,
            reason: `Credits refunded for cancelled order`,
          },
        });
      }

      // Refund gateway payments if any
      const gatewayPaid =
        order.payments
          ?.filter((p) => p.provider !== "INTERNAL" && p.status === "PAID")
          .reduce((s, p) => s + p.amount, 0) || 0;

      if (gatewayPaid > 0) {
        await tx.refund.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            method: "GATEWAY",
            amount: gatewayPaid,
            reason: "Gateway refund requested",
          },
        });
        // Trigger async gateway refund workflow outside this transaction
      }

      return updatedOrder;
    });

    return res.json({
      message: "Order cancelled successfully",
      order: cancelledOrder,
    });
  } catch (err) {
    console.error("Order cancellation failed:", err);
    return res.status(500).json({ error: "Failed to cancel order" });
  }
});

// Get order details by ID -- Both Admin and User
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.userId !== userId && req.user?.role !== "ADMIN") {
      res.status(403).json({ error: "Unauthorized to view this order" });
      return;
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    status,
    paymentStatus,
    carrierName,
    trackingNumber,
    estimatedDelivery,
  } = req.body;

  try {
    // First get the current order
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const updateData: any = {
      statusUpdatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (carrierName) updateData.carrierName = carrierName;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (estimatedDelivery) {
      updateData.estimatedDelivery = new Date(estimatedDelivery);
    }

    // Set timestamps based on status
    if (status === "SHIPPED" && !order.shippedAt) {
      updateData.shippedAt = new Date();
    } else if (status === "DELIVERED" && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true } },
        address: true,
      },
    });

    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// Update Order Status - Admin can update order status
router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses: OrderStatus[] = [
    "PLACED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  try {
    // Validate input
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    // Get current order
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Prepare update data
    const updateData: any = {
      status,
      statusUpdatedAt: new Date(),
    };

    // Set timestamps based on status
    if (status === "SHIPPED" && !order?.shippedAt) {
      updateData.shippedAt = new Date();
    } else if (status === "DELIVERED" && !order?.deliveredAt) {
      updateData.deliveredAt = new Date();
    } else if (status === "CANCELLED" && !order?.cancelledAt) {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = "Cancelled by admin";
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true } },
        address: true,
      },
    });

    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;
