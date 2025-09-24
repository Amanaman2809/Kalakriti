import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { requireAdmin, requireAuth } from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

import { Request, Response } from "express";

//FIXED: Store credits - convert paise to rupees for display
router.get(
  "/store-credits",
  requireAuth,
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    try {
      const credits = await prisma.storeCredit.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const now = new Date();
      const activeCredits = credits.filter(
        (c) => !c.expiresAt || c.expiresAt > now
      );
      const balance = activeCredits.reduce((sum, c) => sum + c.amount, 0);

      // Convert credits from paise to rupees for frontend
      const creditsInRupees = activeCredits.map((credit) => ({
        ...credit,
        amount: credit.amount / 100, // Convert paise to rupees
      }));

      res.json({
        balance: balance / 100, // Convert balance to rupees
        credits: creditsInRupees,
      });
    } catch (err) {
      console.error("Failed to fetch store credit:", err);
      res.status(500).json({ error: "Failed to fetch store credit" });
    }
  }
);

// CREATE RAZORPAY ORDER - Correct (no changes needed)
router.post("/create-razorpay-order", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { orderId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }

  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        items: { include: { product: true } },
      },
    });

    console.log("Creating Razorpay order for:", {
      id: order?.id,
      netAmount: order?.netAmount,
      paymentStatus: order?.paymentStatus,
      status: order?.status,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to pay for this order" });
    }

    // Check payment status
    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ error: "Order is already paid" });
    }

    if (order.paymentStatus !== "PENDING") {
      return res
        .status(400)
        .json({ error: "Order payment status must be PENDING" });
    }

    if (order.netAmount <= 0) {
      return res
        .status(400)
        .json({ error: "No payment required for this order" });
    }

    // netAmount is already in paise, don't convert again
    const amountInPaise = order.netAmount;

    console.log("Payment amounts:", {
      netAmountInPaise: order.netAmount,
      netAmountInRupees: order.netAmount / 100,
      razorpayAmount: amountInPaise,
    });

    // Create Razorpay order
    const razorpayOrderOptions = {
      amount: amountInPaise, // Already in paise
      currency: "INR",
      receipt: order.id.substring(0, 32),
      payment_capture: 1,
      notes: {
        order_id: order.id,
        user_id: userId,
        user_email: order.user.email || "",
      },
    };

    console.log("Creating Razorpay order with options:", razorpayOrderOptions);

    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);

    console.log("Razorpay order created:", razorpayOrder);

    res.json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      order: {
        id: order.id,
        netAmount: order.netAmount / 100, // Convert to rupees for display
        grossAmount: order.grossAmount / 100,
        shippingAmount: order.shippingAmount / 100,
        taxAmount: order.taxAmount / 100,
        creditsApplied: order.creditsApplied / 100,
      },
      customer: {
        name: order.user.name || "Customer",
        email: order.user.email || "",
        phone: order.user.phone || "",
      },
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);

    if (error.error) {
      return res.status(400).json({
        success: false,
        error: `Razorpay Error: ${error.error.description || error.error.code}`,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create payment order",
    });
  }
});

// VERIFY PAYMENT - Correct (no changes needed)
router.post("/verify-payment", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET!)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      console.log("Invalid payment signature");
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

    console.log("Payment details from Razorpay:", {
      id: paymentDetails.id,
      amount: paymentDetails.amount,
      status: paymentDetails.status,
      method: paymentDetails.method,
    });

    if (paymentDetails.status !== "captured") {
      console.log("Payment not captured:", paymentDetails.status);
      return res.status(400).json({
        success: false,
        error: `Payment not successful. Status: ${paymentDetails.status}`,
      });
    }

    // Update order and create payment record
    const result = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: { include: { product: true } },
          address: true,
        },
      });

      if (!currentOrder) {
        throw new Error("Order not found");
      }

      if (currentOrder.paymentStatus === "PAID") {
        throw new Error("Order is already paid");
      }

      if (currentOrder.userId !== userId) {
        throw new Error("Unauthorized");
      }

      // Both amounts are in paise, compare directly
      const orderAmountInPaise = currentOrder.netAmount;
      const paidAmountInPaise =
        typeof paymentDetails.amount === "string"
          ? parseInt(paymentDetails.amount)
          : paymentDetails.amount;

      if (orderAmountInPaise !== paidAmountInPaise) {
        throw new Error(
          `Payment amount mismatch. Expected: ${orderAmountInPaise} paise, Received: ${paidAmountInPaise} paise`
        );
      }

      console.log("Payment amount verified");

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          statusUpdatedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: { include: { product: true } },
          address: true,
        },
      });

      // Store payment amount in paise (as per schema)
      const payment = await tx.payment.create({
        data: {
          orderId: orderId,
          userId: userId,
          provider: "RAZORPAY",
          providerPaymentId: razorpay_payment_id,
          amount: paidAmountInPaise, // Store in paise
          status: "PAID",
          meta: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            method: paymentDetails.method,
            bank: paymentDetails.bank,
            wallet: paymentDetails.wallet,
            vpa: paymentDetails.vpa,
          },
        },
      });

      return { order: updatedOrder, payment };
    });

    res.json({
      success: true,
      message: "Payment verified and order confirmed successfully",
      order: result.order,
      payment: {
        id: result.payment.id,
        amount: result.payment.amount / 100, // Convert to rupees for display
        method: paymentDetails.method,
        status: result.payment.status,
      },
    });
  } catch (error: any) {
    console.error("Payment verification failed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Payment verification failed",
    });
  }
});

// HANDLE PAYMENT FAILURE - Correct (no changes needed)
router.post("/payment-failed", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { orderId, error } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("=== PAYMENT FAILED ===");
    console.log("Payment failed for order:", orderId, "Error:", error);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (
      order &&
      order.userId === userId &&
      order.status === "PLACED" &&
      order.paymentStatus === "PENDING"
    ) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason: "Payment failed",
            statusUpdatedAt: new Date(),
          },
        });

        await Promise.all(
          order.items.map((item) =>
            tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            })
          )
        );
      });
    }

    res.json({
      success: true,
      message: "Payment failure handled",
    });
  } catch (error: any) {
    console.error("Error handling payment failure:", error);
    res.status(500).json({
      success: false,
      error: "Failed to handle payment failure",
    });
  }
});

// Get Payment Details - Correct (no changes needed)
router.get("/order/:orderId", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { orderId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        netAmount: order.netAmount / 100, // Convert to rupees for display
        paymentStatus: order.paymentStatus,
        paymentMode: order.paymentMode,
      },
      payments: order.payments.map((payment) => ({
        ...payment,
        amount: payment.amount / 100, // Convert to rupees for display
      })),
    });
  } catch (error: any) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment details",
    });
  }
});

// Initiate Refund - Correct (no changes needed)
router.post("/refund", requireAuth, requireAdmin, async (req, res) => {
  const { orderId, amount, reason } = req.body;

  try {
    const payment = await prisma.payment.findFirst({
      where: {
        orderId: orderId,
        provider: "RAZORPAY",
        status: "PAID",
      },
    });

    if (!payment || !payment.providerPaymentId) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Payment amount is already in paise
    const refundAmountInPaise = amount
      ? Math.round(amount * 100) // Convert input rupees to paise
      : payment.amount; // payment.amount is already in paise

    // Initiate refund with Razorpay
    const refund = await razorpay.payments.refund(payment.providerPaymentId, {
      amount: refundAmountInPaise,
      notes: {
        reason: reason || "Refund initiated by admin",
        order_id: orderId,
      },
    });

    // Store refund amount in paise (as per schema)
    const refundAmountInPaiseFromGateway = refund.amount
      ? Number(refund.amount)
      : 0;

    await prisma.refund.create({
      data: {
        orderId: orderId,
        userId: payment.userId,
        method: "GATEWAY",
        amount: refundAmountInPaiseFromGateway, // Store in paise
        reason: reason || "Refund initiated",
        meta: {
          razorpay_refund_id: refund.id,
          razorpay_payment_id: payment.providerPaymentId,
        },
      },
    });

    res.json({
      success: true,
      message: "Refund initiated successfully",
      refund: {
        id: refund.id,
        amount: refundAmountInPaiseFromGateway / 100, // Convert to rupees for display
        status: refund.status,
      },
    });
  } catch (error: any) {
    console.error("Error initiating refund:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate refund",
    });
  }
});

export default router;
