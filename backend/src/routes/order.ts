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
  const { addressId, paymentMode } = req.body;

  if (!["COD", "ONLINE"].includes(paymentMode)) {
    res.status(400).json({ error: "Invalid payment mode" });
    return;
  }

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!addressId || typeof addressId !== "string") {
    res.status(400).json({ error: "Invalid address ID" });
    return;
  }

  // Verify address belongs to user
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    res.status(404).json({ error: "Address not found" });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (!cartItems || cartItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
  }

  const total = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );

  if (!total) {
    res.status(400).json({ error: "Invalid total" });
  }

  try {
    if (paymentMode === "COD") {
      const order = await prisma.$transaction(async (tx) => {
        // Create order with address relation
        const createdOrder = await tx.order.create({
          data: {
            userId,
            addressId, // Use addressId instead of raw address string
            total,
            paymentMode,
            paymentStatus: "PAID",
            status: "PLACED",
            items: {
              create: cartItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price,
              })),
            },
          },
          include: {
            address: true,
            items: true,
          },
        });

        // Update product stock
        await Promise.all(
          cartItems.map((item) =>
            tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            }),
          ),
        );

        // Clear cart
        await tx.cartItem.deleteMany({ where: { userId } });

        return createdOrder;
      });

      res.status(201).json({
        message: "Order Placed Successfully",
        order,
      });
    }

    if (paymentMode === "ONLINE") {
      // TODO: Implement Razorpay payment integration
      res.status(200).json({ message: "Payment Successful" });
    }
  } catch (error) {
    console.error("Order placement failed:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
});

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

router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses: OrderStatus[] = ["PLACED", "SHIPPED", "DELIVERED"];

  try {
    // Validate input
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status value" });
    }

    // Get current order
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) res.status(404).json({ error: "Order not found" });

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
