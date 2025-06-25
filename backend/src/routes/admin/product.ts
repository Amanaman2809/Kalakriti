import express, { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { requireAuth, requireAdmin } from "../../middlewares/requireAuth";

const router = express.Router();
const prisma = new PrismaClient();

// TODO: Implement filter by category, and Typesense integration
// Public: list products
router.get("/", async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
    });
    res.json({ products: products });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Public: single product
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin: create product
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, price, stock, categoryId, tags, images } =
    req.body;

  if (
    !name ||
    !price ||
    !categoryId ||
    !Array.isArray(tags) ||
    !Array.isArray(images)
  ) {
    res.status(400).json({ error: "Missing or invalid fields" });
    return;
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        tags,
        images,
      },
    });
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Creation failed" });
  }
});

// Admin: Add Products in bulk
router.post("/bulk", requireAuth, requireAdmin, async (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products)) {
    res.status(400).json({ error: "Invalid products array" });
    return;
  }

  try {
    const createdProducts = await prisma.product.createMany({
      data: products.map((product) => ({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId,
        tags: product.tags,
        images: product.images,
      })),
    });
    res.status(201).json(createdProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bulk creation failed" });
  }
});

// Admin: update product
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, categoryId, tags, images } =
    req.body;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { name, description, price, stock, categoryId, tags, images },
    });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Admin: delete product
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
