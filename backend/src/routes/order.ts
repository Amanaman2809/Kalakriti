import express from "express";
import { OrderStatus, PrismaClient } from "../generated/prisma/client";
import { requireAdmin, requireAuth } from "../middlewares/requireAuth";
import { transformProduct } from "../lib/productTransform";

const router = express.Router();
const prisma = new PrismaClient();

// Helper function for precise financial calculations
const toPreciseRupees = (amount: number): number => {
  return Math.round(amount * 100) / 100; // Always 2 decimal places
};

// Helper function to round to nearest rupee (no decimals)
const toRoundedRupees = (amount: number): number => {
  return Math.round(amount); // Round to whole rupees for customer charges
};

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
        address: true,
      },
    });

    // Use transformProduct on product
    const transformedOrders = orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: transformProduct(item.product),
      })),
    }));

    res.json({ orders: transformedOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Place Order - FIXED FOR FINANCIAL PRECISION & PROPER WORKFLOW
router.post("/", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { addressId, paymentMode } = req.body;

  if (!["COD", "ONLINE"].includes(paymentMode)) {
    return res.status(400).json({ error: "Invalid payment mode" });
  }

  if (!addressId) {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    // ✅ STEP 1: Validate everything BEFORE creating order or touching stock
    console.log("=== ORDER VALIDATION PHASE ===");

    // Load and validate cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (!cartItems.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Validate address exists
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      return res.status(400).json({ error: "Invalid address" });
    }

    // ✅ STEP 2: Stock validation - CHECK BEFORE RESERVATION
    console.log("=== STOCK VALIDATION ===");
    const productIds = cartItems.map((c) => c.productId);
    const productsInDB = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        discountPct: true,
      },
    });

    const stockValidation = cartItems.map((item) => {
      const product = productsInDB.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} no longer exists`);
      }
      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }
      return {
        productId: product.id,
        name: product.name,
        requestedQty: item.quantity,
        availableStock: product.stock,
        discountedPrice: Math.floor(
          product.price * (1 - (product.discountPct || 0) / 100),
        ),
      };
    });

    console.log("Stock validation passed:", stockValidation);

    // ✅ STEP 3: PRECISE FINANCIAL CALCULATIONS - NO MONEY ERRORS
    console.log("=== FINANCIAL CALCULATIONS ===");

    // Calculate gross amount with precise values
    const grossAmount = toPreciseRupees(
      cartItems.reduce(
        (sum, item) =>
          sum +
          Math.floor(
            item.product.price * (1 - (item.product.discountPct || 0) / 100),
          ) *
            item.quantity,
        0,
      ),
    );

    // Shipping calculation
    const shippingAmount = grossAmount >= 999 ? 0 : 99;

    // Tax calculation - precise but rounded for customer
    const calculatedTax = toPreciseRupees(grossAmount * 0.18);
    const taxAmount = toRoundedRupees(calculatedTax); // Round tax to nearest rupee

    // Total before credits
    const grossPlusExtras = toRoundedRupees(
      grossAmount + shippingAmount + taxAmount,
    );

    console.log("Financial calculations:", {
      grossAmount: grossAmount,
      shippingAmount: shippingAmount,
      calculatedTax: calculatedTax,
      taxAmount: taxAmount,
      grossPlusExtras: grossPlusExtras,
    });

    // ✅ STEP 4: Handle store credits
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

    // ✅ FINAL AMOUNT - ALWAYS WHOLE RUPEES
    const netAmount = toRoundedRupees(grossPlusExtras - creditsToApply);

    console.log("Final order amounts:", {
      grossAmount,
      shippingAmount,
      taxAmount,
      grossPlusExtras,
      creditsToApply,
      netAmount,
    });

    // ✅ STEP 5: Create order and handle stock in TRANSACTION
    console.log("=== CREATING ORDER ===");

    const order = await prisma.$transaction(
      async (tx) => {
        // ✅ DOUBLE-CHECK STOCK AGAIN in transaction (prevent race conditions)
        for (const validation of stockValidation) {
          const currentStock = await tx.product.findUnique({
            where: { id: validation.productId },
            select: { stock: true },
          });

          if (!currentStock || currentStock.stock < validation.requestedQty) {
            throw new Error(
              `Stock changed for ${validation.name}. Please refresh and try again.`,
            );
          }
        }

        // ✅ CREATE ORDER FIRST
        const createdOrder = await tx.order.create({
          data: {
            userId,
            addressId,
            paymentMode,
            paymentStatus: netAmount === 0 ? "PAID" : "PENDING",
            status: "PENDING", // ✅ PENDING until payment confirmed
            grossAmount: toRoundedRupees(grossAmount),
            shippingAmount,
            taxAmount,
            creditsApplied: creditsToApply,
            netAmount,
            items: {
              create: cartItems.map((ci) => ({
                productId: ci.productId,
                quantity: ci.quantity,
                price: toRoundedRupees(
                  stockValidation.find((s) => s.productId === ci.productId)
                    ?.discountedPrice || 0,
                ),
              })),
            },
          },
          include: {
            items: { include: { product: true } },
            address: true,
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        });

        // ✅ RESERVE STOCK (decrement) - ONLY AFTER ORDER CREATED
        console.log("Reserving stock...");
        await Promise.all(
          cartItems.map(async (ci) => {
            await tx.product.update({
              where: { id: ci.productId },
              data: { stock: { decrement: ci.quantity } },
            });
            console.log(
              `Reserved ${ci.quantity} units of product ${ci.productId}`,
            );
          }),
        );

        // Handle store credits
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
          await tx.storeCredit.create({
            data: {
              userId,
              amount: -creditsToApply,
              reason: `Applied to order ${createdOrder.id}`,
            },
          });
        }

        // Clear cart ONLY after successful order creation
        await tx.cartItem.deleteMany({ where: { userId } });

        // Handle zero-amount orders
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

          // Update order status to PLACED for zero amount
          await tx.order.update({
            where: { id: createdOrder.id },
            data: { status: "PLACED", paymentStatus: "PAID" },
          });
        }

        return createdOrder;
      },
      {
        timeout: 10000, // 10 second timeout
      },
    );

    console.log("✅ Order created successfully:", order.id);

    // ✅ DIFFERENT RESPONSES BASED ON PAYMENT MODE
    if (paymentMode === "COD") {
      // COD orders are immediately placed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PLACED" },
      });

      return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order: { ...order, status: "PLACED" },
      });
    }

    if (paymentMode === "ONLINE" && netAmount > 0) {
      return res.status(200).json({
        success: true,
        message: "Order created. Please complete payment",
        order: order,
        requiresPayment: true,
        paymentAmount: netAmount,
      });
    }

    // Zero amount orders (fully covered by credits)
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: order,
    });
  } catch (error: any) {
    console.error("❌ Order placement failed:", error);

    // ✅ RESTORE STOCK if error occurred after stock decrement
    // This is handled by transaction rollback automatically

    return res.status(500).json({
      error: error.message || "Failed to place order",
    });
  }
});

// Cancel Order - use unified transaction function
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { reason } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to cancel this order" });
    }

    // Only allow PENDING/PLACED orders
    if (!["PENDING", "PLACED"].includes(order.status)) {
      return res
        .status(400)
        .json({ error: `Cannot cancel order with status: ${order.status}` });
    }

    const hoursDiff =
      (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      return res
        .status(400)
        .json({ error: "Cancellation window expired (24 hours)" });
    }

    // ✅ Call unified transaction function
    const cancelledOrder = await prisma.$transaction((tx) =>
      cancelOrderWithTransaction(
        id,
        userId,
        reason || "Cancelled by customer",
        tx,
      ),
    );

    return res.json({
      success: true,
      message: "Order cancelled successfully",
      order: cancelledOrder,
    });
  } catch (err: any) {
    console.error("Order cancellation failed:", err);
    return res.status(500).json({ error: "Failed to cancel order" });
  }
});

// Get order details by ID with financial summary
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        address: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        payments: true,
        orderCredits: true, // include applied store credits
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.userId !== userId && req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized to view this order" });
    }

    const itemsWithTotals = order.items.map((item) => {
      const originalPriceRupees = item.product.price / 100;
      const discountedPriceRupees = item.price; // already in rupees
      const discountRupees =
        (originalPriceRupees - discountedPriceRupees) * item.quantity;
      const total = discountedPriceRupees * item.quantity;

      return {
        id: item.id,
        product: item.product,
        quantity: item.quantity,
        price: discountedPriceRupees,
        total,
        discount: discountRupees,
      };
    });

    const totalDiscount = itemsWithTotals.reduce(
      (sum, item) => sum + item.discount,
      0,
    );

    const grossAmount = itemsWithTotals.reduce(
      (sum, item) => sum + item.total,
      0,
    );
    const shippingAmount = order.shippingAmount;
    const taxAmount = order.taxAmount;
    const creditsApplied = order.creditsApplied;
    const totalAmount = grossAmount + shippingAmount + taxAmount;
    const finalAmountToPay = Math.max(totalAmount - creditsApplied, 0);

    // Prepare payments info
    const payments = order.payments.map((p) => ({
      id: p.id,
      provider: p.provider,
      amount: p.amount / 100,
      status: p.status,
      createdAt: p.createdAt,
      meta: p.meta,
    }));

    // Build response
    const response = {
      id: order.id,
      user: order.user,
      address: order.address,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.statusUpdatedAt,
      items: itemsWithTotals.map((item) => ({
        id: item.id,
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        discount: item.discount,
      })),
      financials: {
        grossAmount,
        shippingAmount,
        taxAmount,
        totalDiscount,
        creditsApplied,
        totalAmount,
        finalAmountToPay,
      },
      payments,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Admin update order
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
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updateData: any = { statusUpdatedAt: new Date() };

    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (carrierName) updateData.carrierName = carrierName;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (estimatedDelivery)
      updateData.estimatedDelivery = new Date(estimatedDelivery);

    // Set timestamps
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

// Update Order Status
router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses: OrderStatus[] = [
    "PENDING",
    "PLACED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  try {
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updateData: any = { status, statusUpdatedAt: new Date() };

    if (status === "SHIPPED" && !order.shippedAt) {
      updateData.shippedAt = new Date();
    } else if (status === "DELIVERED" && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    } else if (status === "CANCELLED") {
      const cancelledOrder = await prisma.$transaction(async (tx) => {
        return cancelOrderWithTransaction(
          id,
          order.userId,
          "Cancelled by admin",
          tx,
        );
      });
      return res.json(cancelledOrder);
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
    res.status(500).json({ error: "Failed to update order status" });
  }
});

async function cancelOrderWithTransaction(
  orderId: string,
  userId: string,
  reason: string,
  tx: any,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      orderCredits: true,
      payments: true,
    },
  });

  if (!order) throw new Error("Order not found");

  // Update order status
  const updatedOrder = await tx.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: reason || "Cancelled by admin",
      statusUpdatedAt: new Date(),
      paymentStatus:
        order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus,
    },
    include: {
      items: { include: { product: true } },
      address: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  // Restore stock
  await Promise.all(
    order.items.map(async (item: any) => {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }),
  );

  // Refund all store credits applied to the order
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

  // Refund all paid amounts (gateway/online) as store credits
  const gatewayPaid =
    order.payments
      ?.filter((p: any) => p.status === "PAID") // Include all PAID payments
      .reduce((s: any, p: any) => s + p.amount, 0) || 0;

  if (gatewayPaid > 0) {
    await tx.storeCredit.create({
      data: {
        userId: order.userId,
        amount: gatewayPaid,
        reason: `Refund for cancelled order ${order.id} (online payment)`,
      },
    });

    await tx.refund.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        method: "STORE_CREDIT",
        amount: gatewayPaid,
        reason: "Converted online payment refund to store credit",
      },
    });
  }

  return updatedOrder;
}

export default router;
