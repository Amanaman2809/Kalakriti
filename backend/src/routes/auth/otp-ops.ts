import express, { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { generateOTP, hashOTP, sendOTPByEmail } from "../../utils/otp";
import { canRequestOTP } from "../../lib/rateLimit";

const router = express.Router();
const prisma = new PrismaClient();

interface OTPRequest {
  email: string;
}

interface OTPVerificationRequest {
  email: string;
  otp: string;
}

// Request OTP via Email
router.post(
  "/request-otp",
  async (req: Request<{}, {}, OTPRequest>, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!canRequestOTP(email)) {
        return res.status(429).json({
          error: "Too many requests. Please try again later.",
        });
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

      const emailSent = await sendOTPByEmail(email, otp);
      if (!emailSent) {
        throw new Error("Failed to send email");
      }

      return res.status(200).json({
        message: "OTP sent successfully to your email",
      });
    } catch (error) {
      console.error("OTP request error:", error);
      return res.status(500).json({ error: "Failed to process OTP request" });
    }
  }
);

// Verify OTP
router.post(
  "/verify-otp",
  async (req: Request<{}, {}, OTPVerificationRequest>, res: Response) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: "Email and OTP are required",
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.otp || !user.otpExpiresAt) {
        return res.status(400).json({ error: "Invalid verification request" });
      }

      if (user.otpExpiresAt < new Date()) {
        return res.status(400).json({ error: "OTP has expired" });
      }

      const hashedInput = hashOTP(otp);
      if (hashedInput !== user.otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          otp: null,
          otpExpiresAt: null,
        },
      });

      return res.status(200).json({
        message: "OTP verified successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: true,
        },
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      return res.status(500).json({ error: "Failed to verify OTP" });
    }
  }
);

export default router;
