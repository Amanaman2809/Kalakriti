import express, { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { generateOTP, hashOTP } from "../../utils/otp";
import { canRequestOTP } from "../../lib/rateLimit";
import bcrypt from "bcrypt";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/request-reset", async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }

  const canSend = canRequestOTP(phone);
  if (!canSend) {
    res.status(429).json({ error: "Too many requests. Try again later" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const otp = generateOTP();
  const hashedOTP = hashOTP(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minute later

  await prisma.user.update({
    where: { phone },
    data: { otp: hashedOTP, otpExpiresAt: expiresAt },
  });

  // TODO : Implement OTP sending logic here
  // [!] Mock OTP sending logic
  console.log(`[MOCK] Reset OTP for ${phone}: ${otp}`);

  res.status(200).json({ message: "Reset OTP sent successfully" });
});

router.post("/reset-pass", async (req: Request, res: Response) => {
  const { phone, otp, password } = req.body;

  if (!phone || !otp || !password) {
    res
      .status(400)
      .json({ error: "Phone number, OTP, and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (!user.otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }

  const hashedOTP = hashOTP(otp);
  if (hashedOTP !== user.otp) {
    res.status(401).json({ error: "Invalid OTP" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { phone },
    data: { password: hashedPassword, otp: null, otpExpiresAt: null },
  });

  res.status(200).json({ message: "Password reset successfully" });
});

export default router;
