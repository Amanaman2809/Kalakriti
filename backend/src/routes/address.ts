import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { requireAuth, AuthenticatedRequest } from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
    });

    res.json(addresses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { street, city, state, country, postalCode, phone } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!street || !city || !state || !country || !postalCode || !phone) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const address = await prisma.address.create({
      data: {
        userId,
        street,
        city,
        state,
        country,
        postalCode,
        phone,
      },
    });

    res.status(201).json(address);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create address" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.userId !== userId) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    await prisma.address.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete address" });
  }
});
