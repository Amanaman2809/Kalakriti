import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

// Get all products in a category
router.get("/category/:id/products", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "Category ID is required" });
    return;
  }

  try {
    const products = await prisma.product.findMany({
      where: { categoryId: id },
    });

    res.json(products);
  } catch (err) {
    console.error("Error fetching products for category", id, err);
    res
      .status(500)
      .json({ error: "Failed to fetch products for this category" });
  }
});
// Create a new category
router.post("/admin/categories", requireAuth, requireAdmin, async (req, res) => {
  const { name, image } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name required" });
    return;
  }

  try {
    const category = await prisma.category.create({ data: { name, image } });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Category creation failed" });
  }
});

// Update the Category Name and Image
router.put(
  "/admin/category/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { name, image } = req.body;
    if (!name) {
      res.status(400).json({ error: "Name required" });
      return;
    }

    try {
      const category = await prisma.category.update({
        where: { id },
        data: { name, image },
      });
      res.json(category);
    } catch (err) {
      res.status(500).json({ error: "Category update failed" });
    }
  },
);

// Delete a category
router.delete(
  "/admin/category/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;

    try {
      await prisma.category.delete({ where: { id } });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: "Category deletion failed" });
    }
  },
);

export default router;
