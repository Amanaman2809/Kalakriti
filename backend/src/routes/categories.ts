import express from "express";
import { PrismaClient } from "../generated/prisma/client";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to convert paise to rupees
const paiseToRupees = (paise: number): number => {
  return paise / 100;
};

// Get all categories
router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

// Get all products in a category - FIXED: Convert paise to rupees
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

    // Convert product prices from paise to rupees
    const productsWithRupeePrices = products.map((product) => ({
      ...product,
      price: paiseToRupees(product.price), // original
      finalPrice: Math.floor(
        paiseToRupees(product.price) * (1 - (product.discountPct || 0) / 100),
      ),
    }));

    res.json(productsWithRupeePrices);
  } catch (err) {
    console.error("Error fetching products for category", id, err);
    res
      .status(500)
      .json({ error: "Failed to fetch products for this category" });
  }
});

// Create a new category
router.post(
  "/admin/categories",
  requireAuth,
  requireAdmin,
  async (req, res) => {
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
  },
);

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
