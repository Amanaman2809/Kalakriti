import express from "express";
import { OrderStatus, PrismaClient } from "../generated/prisma/client";
import { requireAdmin, requireAuth } from "../middlewares/requireAuth";
import { transformProduct } from "../lib/productTransform";

const router = express.Router();
const prisma = new PrismaClient();

// ✅ FIXED: Helper functions to work with PAISE
const toPaise = (rupees: number): number => {
  return Math.round(rupees * 100); // Convert rupees to paise
};

const toRoundedPaise = (paise: number): number => {
  return Math.round(paise / 100) * 100; // Round to nearest whole rupee (100 paise)
};

const toRupees = (paise: number): number => {
  return paise / 100; // Convert paise to rupees for display
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

// Place Order - FIXED FOR PAISE CALCULATIONS
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
      
      // Calculate discounted price in RUPEES first
      const discountedPriceInRupees = Math.floor(
        (product.price * (1 - (product.discountPct || 0) / 100))/100
      );
      
      return {
        productId: product.id,
        name: product.name,
        requestedQty: item.quantity,
        availableStock: product.stock,
        discountedPriceInRupees: discountedPriceInRupees,
        discountedPriceInPaise: toPaise(discountedPriceInRupees),
      };
    });

    console.log("Stock validation passed:", stockValidation);

    // ✅ STEP 3: PRECISE FINANCIAL CALCULATIONS - ALL IN PAISE
    console.log("=== FINANCIAL CALCULATIONS ===");

    // Calculate gross amount in PAISE
    const grossAmountInPaise = cartItems.reduce(
      (sum, item) => {
        const validation = stockValidation.find(s => s.productId === item.productId);
        return sum + (validation!.discountedPriceInPaise * item.quantity);
      },
      0
    );

    // Shipping calculation in PAISE (₹999 threshold = 99900 paise)
    const shippingAmountInPaise = grossAmountInPaise >= 99900 ? 0 : 9900; // ₹99 = 9900 paise

    // Tax calculation in PAISE (18%)
    const taxAmountInPaise = Math.round(grossAmountInPaise * 0.18);

    // Total before credits - all in PAISE
    const totalBeforeRoundingInPaise = grossAmountInPaise + shippingAmountInPaise + taxAmountInPaise;

    // ✅ Round to nearest whole rupee (nearest 100 paise)
    const grossPlusExtrasInPaise = toRoundedPaise(totalBeforeRoundingInPaise);

    console.log("Financial calculations (in PAISE):", {
      grossAmountInPaise,                    // 9000 (₹90)
      shippingAmountInPaise,                 // 9900 (₹99)
      taxAmountInPaise,                      // 1620 (₹16.20)
      totalBeforeRoundingInPaise,            // 20520 (₹205.20)
      grossPlusExtrasInPaise,                // 20500 (₹205) - rounded
      grossAmountInRupees: toRupees(grossAmountInPaise),
      finalTotalInRupees: toRupees(grossPlusExtrasInPaise),
    });

    // ✅ STEP 4: Handle store credits (in PAISE)
    const now = new Date();
    const credits = await prisma.storeCredit.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        amount: { gt: 0 },
      },
      orderBy: { createdAt: "asc" },
    });

    let availableCreditInPaise = credits.reduce((s, c) => s + c.amount, 0);
    let creditsToApplyInPaise = 0;
    let orderCreditsToCreate: { storeCreditId: string; amount: number }[] = [];

    if (availableCreditInPaise > 0) {
      creditsToApplyInPaise = Math.min(availableCreditInPaise, grossPlusExtrasInPaise);
      let remainingToUse = creditsToApplyInPaise;
      for (const c of credits) {
        if (remainingToUse <= 0) break;
        const usable = Math.min(c.amount, remainingToUse);
        orderCreditsToCreate.push({ storeCreditId: c.id, amount: usable });
        remainingToUse -= usable;
      }
    }

    // ✅ FINAL AMOUNT - Rounded to whole rupees in PAISE
    const netAmountInPaise = toRoundedPaise(grossPlusExtrasInPaise - creditsToApplyInPaise);

    console.log("Final order amounts (in PAISE):", {
      grossAmountInPaise,                    // 9000
      shippingAmountInPaise,                 // 9900
      taxAmountInPaise,                      // 1620
      grossPlusExtrasInPaise,                // 20500
      creditsToApplyInPaise,                 // 0
      netAmountInPaise,                      // 20500
      netAmountInRupees: toRupees(netAmountInPaise), // ₹205
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

        // ✅ CREATE ORDER FIRST - Store everything in PAISE
        const createdOrder = await tx.order.create({
          data: {
            userId,
            addressId,
            paymentMode,
            paymentStatus: netAmountInPaise === 0 ? "PAID" : "PENDING",
            status: "PENDING",
            grossAmount: grossAmountInPaise,          // Store in paise
            shippingAmount: shippingAmountInPaise,    // Store in paise
            taxAmount: taxAmountInPaise,              // Store in paise
            creditsApplied: creditsToApplyInPaise,    // Store in paise
            netAmount: netAmountInPaise,              // Store in paise
            items: {
              create: cartItems.map((ci) => {
                const validation = stockValidation.find(s => s.productId === ci.productId);
                return {
                  productId: ci.productId,
                  quantity: ci.quantity,
                  price: validation!.discountedPriceInPaise, // Store in paise
                };
              }),
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

        if (creditsToApplyInPaise > 0) {
          await tx.storeCredit.create({
            data: {
              userId,
              amount: -creditsToApplyInPaise,
              reason: `Applied to order ${createdOrder.id}`,
            },
          });
        }

        // Clear cart ONLY after successful order creation
        await tx.cartItem.deleteMany({ where: { userId } });

        // Handle zero-amount orders
        if (netAmountInPaise === 0) {
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

    if (paymentMode === "ONLINE" && netAmountInPaise > 0) {
      return res.status(200).json({
        success: true,
        message: "Order created. Please complete payment",
        order: order,
        requiresPayment: true,
        paymentAmount: toRupees(netAmountInPaise), // Send in rupees for display
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
        tx
      )
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
      0
    );

    const grossAmount = itemsWithTotals.reduce(
      (sum, item) => sum + item.total,
      0
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
          tx
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
  tx: any
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
    })
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
