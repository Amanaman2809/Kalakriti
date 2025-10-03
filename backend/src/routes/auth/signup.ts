import bcrypt from "bcrypt";
import { PrismaClient } from "../../generated/prisma/client"; // Use correct path if aliasing
import express, { Request, Response } from "express";
import { requireAuth } from "../../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/signup", async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body as {
    name: string;
    email: string;
    phone: string;
    password: string;
  };

  if (!name || !email || !phone || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    res.status(409).json({ error: "Email or phone already in use" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/edit-profile",
  requireAuth,
  async (req: Request, res: Response) => {
    const { name, email, phone } = req.body as {
      name: string;
      email: string;
      phone: string;
    };

    const userID = req.user?.id;

    if (!userID || !name || !email || !phone) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    try {
      const user = await prisma.user.update({
        where: { id: userID },
        data: {
          name,
          email,
          phone,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      });

      res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
