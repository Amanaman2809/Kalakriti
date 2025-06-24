import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "../../generated/prisma/client";
import { generateToken } from "../../lib/jwt";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    res.status(401).json({ error: "Wrong Password" });
    return;
  }

  if (!user.isVerified) {
    res.status(401).json({ error: "Account not verified" });
    return;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    message: "Login Successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export default router;
