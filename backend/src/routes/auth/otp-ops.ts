import express from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { generateOTP, hashOTP } from "../../utils/otp";
import { canRequestOTP } from "../../lib/rateLimit";

const router = express.Router();
const prisma = new PrismaClient();

// TODO: Implement OTP sending service integration
// [!] Currently all of this is just a mock, we need to integrate the real logic here

// Request OTP
router.post("/request-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }

  if (!canRequestOTP(phone)) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const otp = generateOTP();
  const hashed = hashOTP(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp: hashed,
      otpExpiresAt: expiresAt,
    },
  });

  // TODO: Integrate OTP sending service. For now, just logging the OTP
  // [!] Mock implementation
  console.log(`OTP sent to ${phone}: ${otp}`);

  res.status(200).json({ message: "OTP sent successfully" });
});

// Mock Testing Route
router.get("/:phone", async (req, res) => {
  const { phone } = req.params;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.otp) {
    res.status(404).json({ error: "No otp stored for this user" });
    return;
  }

  res.status(200).json({ hashedOtp: user.otp, expiresAt: user.otpExpiresAt });
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    res.status(400).json({ error: "Phone and OTP are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || !user.otp || !user.otpExpiresAt) {
    res.status(400).json({ error: "OTP not requested or invalid phone" });
    return;
  }

  if (user.otpExpiresAt < new Date()) {
    res.status(400).json({ error: "OTP expired" });
    return;
  }

  const hashedInput = hashOTP(otp);
  if (hashedInput !== user.otp) {
    res.status(400).json({ error: "Invalid OTP" });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      otp: null,
      otpExpiresAt: null,
    },
  });

  res.status(200).json({ message: "OTP verified successfully" });
});

export default router;
