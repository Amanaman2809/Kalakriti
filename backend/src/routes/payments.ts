import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import {
  // AuthenticatedRequest,
  requireAdmin,
  requireAuth,
} from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

// Get store credit balance for logged-in user
import { Request, Response } from "express";

router.get(
  "/store-credits",
  requireAuth,
  async (req: Request, res: Response) => {
    const userId = req.body.id;
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
        (c) => !c.expiresAt || c.expiresAt > now,
      );
      const balance = activeCredits.reduce((sum, c) => sum + c.amount, 0);

      res.json({ balance, credits: activeCredits });
    } catch (err) {
      console.error("Failed to fetch store credit:", err);
      res.status(500).json({ error: "Failed to fetch store credit" });
    }
  },
);

// Route 1: Create Razorpay Order for existing Order
router.post("/create-razorpay-order", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { orderId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Get the order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to pay for this order" });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ error: "Order is already paid" });
    }

    if (order.netAmount <= 0) {
      return res
        .status(400)
        .json({ error: "No payment required for this order" });
    }

    // Create Razorpay order
    const razorpayOrderOptions = {
      amount: order.netAmount, // Amount is already in paise in your system
      currency: "INR",
      receipt: `order_${order.id}`,
      payment_capture: 1,
      notes: {
        order_id: order.id,
        user_id: userId,
        user_email: order.user.email,
      },
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);

    res.json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      order: {
        id: order.id,
        netAmount: order.netAmount,
        grossAmount: order.grossAmount,
        shippingAmount: order.shippingAmount,
        taxAmount: order.taxAmount,
        creditsApplied: order.creditsApplied,
      },
      customer: {
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      },
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create payment order",
    });
  }
});

// Route 2: Verify Payment
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
    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET!)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

    // Update order and create payment record in transaction
    const result = await prisma.$transaction(async (tx) => {
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

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          orderId: orderId,
          userId: userId,
          provider: "RAZORPAY",
          providerPaymentId: razorpay_payment_id,
          amount:
            typeof paymentDetails.amount === "string"
              ? parseFloat(paymentDetails.amount)
              : paymentDetails.amount,

          status: "PAID",
          meta: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            method: paymentDetails.method,
            bank: paymentDetails.bank,
            wallet: paymentDetails.wallet,
            vpa: paymentDetails.vpa, // UPI ID
          },
        },
      });

      return { order: updatedOrder, payment };
    });

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: result.order,
      payment: {
        id: result.payment.id,
        amount: result.payment.amount,
        method: paymentDetails.method,
        status: result.payment.status,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      error: "Payment verification failed",
    });
  }
});

// Route 3: Handle Payment Failure
router.post("/payment-failed", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { orderId, error } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Log the payment failure
    console.log("Payment failed for order:", orderId, "Error:", error);

    // You can optionally create a failed payment record
    // Or update order with failure reason
    // This depends on your business requirements

    res.json({
      success: true,
      message: "Payment failure recorded",
    });
  } catch (error) {
    console.error("Error handling payment failure:", error);
    res.status(500).json({
      success: false,
      error: "Failed to handle payment failure",
    });
  }
});

// Route 4: Get Payment Details
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
        netAmount: order.netAmount,
        paymentStatus: order.paymentStatus,
        paymentMode: order.paymentMode,
      },
      payments: order.payments,
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment details",
    });
  }
});

// Route 5: Initiate Refund (Admin only)
router.post("/refund", requireAuth, async (req, res) => {
  const { orderId, amount, reason } = req.body;

  // You can add admin check here if needed
  // if (req.user?.role !== "ADMIN") {
  //   return res.status(403).json({ error: "Admin access required" });
  // }

  try {
    // Get the payment details
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

    // Initiate refund with Razorpay
    const refund = await razorpay.payments.refund(payment.providerPaymentId, {
      amount: amount || payment.amount,
      notes: {
        reason: reason || "Refund initiated by admin",
        order_id: orderId,
      },
    });

    // Create refund record
    await prisma.refund.create({
      data: {
        orderId: orderId,
        userId: payment.userId,
        method: "GATEWAY",
        amount: refund.amount ? Number(refund.amount) : 0,
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
        amount: refund.amount,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error("Error initiating refund:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate refund",
    });
  }
});

export default router;
