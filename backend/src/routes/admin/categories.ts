import express from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { requireAuth, requireAdmin } from "../../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

// Create a new category
router.post("/categories", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name required" });
    return;
  }

  try {
    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Category creation failed" });
  }
});

// Update the Category Name
router.put("/category/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name required" });
    return;
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name },
    });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Category update failed" });
  }
});

// Delete a category
router.delete("/category/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.category.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Category deletion failed" });
  }
});

export default router;
