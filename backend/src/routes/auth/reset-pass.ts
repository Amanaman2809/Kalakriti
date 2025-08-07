import express, { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import {  hashOTP } from "../../utils/otp";
import bcrypt from "bcrypt";

const router = express.Router();
const prisma = new PrismaClient();

interface ResetConfirmRequest {
  email: string;
  otp: string;
  password: string;
}

router.post(
  "/reset-pass",
  async (req: Request<{}, {}, ResetConfirmRequest>, res: Response) => {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        error: "Email, OTP and password are required",
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: "Password must be at least 8 characters",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          otp: null,
          otpExpiresAt: null,
        },
      });

      return res.status(200).json({
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      return res.status(500).json({ error: "Failed to reset password" });
    }
  }
);

export default router;
