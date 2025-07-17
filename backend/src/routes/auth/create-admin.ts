import express, { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import bcrypt from "bcrypt";

const router = express.Router();
const prisma = new PrismaClient();

router.post(
  "/create-admin",
  async (req: Request, res: Response): Promise<any> => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "ADMIN",
        isVerified: true,
      },
    });

    res.status(201).json({ message: "Admin created", admin });
  }
);

export default router;
