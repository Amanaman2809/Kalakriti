import express, { Request, Response } from "express";
import { Prisma, PrismaClient } from "../../generated/prisma/client";
import { requireAuth, requireAdmin } from "../../middlewares/requireAuth";
import {
  formatToTwoDecimals,
  paiseToRupees,
  rupeesToPaise,
} from "../../utils/sharedFunctions";

const router = express.Router();
const prisma = new PrismaClient();

// Public: Get all products (convert paise to rupees)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
    });

    // Convert prices from paise to rupees for frontend
    const productsWithRupeePrices = products.map((product) => ({
      ...product,
      price: paiseToRupees(product.price), // original
      finalPrice: Math.floor(
        paiseToRupees(product.price) * (1 - (product.discountPct || 0) / 100),
      ),
    }));

    res.json({ products: productsWithRupeePrices });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Public: single product (convert paise to rupees)
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

    // Convert price from paise to rupees
    const productWithRupeePrice = {
      ...product,
      price: paiseToRupees(product.price), // original
      finalPrice: Math.floor(
        paiseToRupees(product.price) * (1 - (product.discountPct || 0) / 100),
      ),
    };

    res.json(productWithRupeePrice);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin: create product (convert rupees to paise)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const {
    name,
    description,
    discount,
    price,
    stock,
    categoryId,
    tags,
    images,
  } = req.body;

  if (discount < 0 || discount > 100) {
    return res.status(400).json({ error: "Discount must be between 0-100%" });
  }

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
    // Convert price from rupees to paise
    const priceInPaise = rupeesToPaise(Number(price));

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: priceInPaise, //Store in paise
        stock: Math.max(Number(stock), 0),
        discountPct: Number(discount) || 0,
        categoryId,
        tags,
        images,
      },
    });

    // Return with price converted back to rupees
    const responseProduct = {
      ...product,
      price: paiseToRupees(product.price),
      finalPrice: Math.floor(
        paiseToRupees(
          product.price - (product.price * (product.discountPct || 0)) / 100,
        ),
      ),
    };

    res.status(201).json(responseProduct);
  } catch (err) {
    console.error("Product creation error:", err);
    res.status(500).json({ error: "Creation failed" });
  }
});

// Admin: Add Products in bulk (convert rupees to paise)
// router.post("/bulk", requireAuth, requireAdmin, async (req, res) => {
//   const { products } = req.body;

//   if (!Array.isArray(products)) {
//     res.status(400).json({ error: "Invalid products array" });
//     return;
//   }

//   try {
//     // Convert all prices from rupees to paise
//     const productsWithPaisePrices = products.map((product) => ({
//       name: product.name,
//       description: product.description,
//       price: rupeesToPaise(Number(product.price)), // Convert to paise
//       stock: Math.max(Number(product.stock), 0),
//       categoryId: product.categoryId,
//       discountPct: Math.min(Math.max(Number(product.discount) || 0, 0), 100),
//       tags: product.tags,
//       images: product.images,
//     }));

//     const createdProducts = await prisma.product.createMany({
//       data: productsWithPaisePrices,
//     });

//     res.status(201).json(createdProducts);
//   } catch (err) {
//     console.error("Bulk creation error:", err);
//     res.status(500).json({ error: "Bulk creation failed" });
//   }
// });

// Admin: update product (convert rupees to paise)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    discount,
    price,
    stock,
    categoryId,
    tags,
    images,
  } = req.body;

  try {
    const priceInRupees = Number(price);
    const priceInPaise = rupeesToPaise(priceInRupees);

    if (discount < 0 || discount > 100) {
      return res.status(400).json({ error: "Discount must be between 0-100%" });
    }

    // console.log("Converted to paise:", priceInPaise);

    if (isNaN(priceInPaise) || priceInPaise < 0) {
      return res.status(400).json({ error: "Invalid price value" });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        discountPct: Number(discount) || 0,
        price: priceInPaise, // Store in paise
        stock: Math.max(Number(stock), 0),
        categoryId,
        tags,
        images,
      },
    });

    // Return with price converted back to rupees
    const responseProduct = {
      ...product,
      price: paiseToRupees(product.price),
      finalPrice: Math.floor(
        paiseToRupees(product.price) * (1 - (product.discountPct || 0) / 100),
      ),
    };

    res.json(responseProduct);
  } catch (err) {
    console.error("Product update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Admin: update discount only
router.patch("/:id/discount", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { discount } = req.body;

  try {
    const discountValue = Number(discount);

    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      return res
        .status(400)
        .json({ error: "Discount must be a number between 0 and 100" });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        discountPct: discountValue,
      },
    });

    // Respond with rupees + final price for consistency
    const responseProduct = {
      ...product,
      price: product.price / 100,
      finalPrice: Math.floor(
        paiseToRupees(product.price) * (1 - (product.discountPct || 0) / 100),
      ),
    };

    res.json(responseProduct);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Product not found" });
      }
    }
    console.error("Discount update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Admin: delete product (no price conversion needed)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.product.delete({ where: { id } });
    return res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      switch (err.code) {
        case "P2025": // Record not found
          return res.status(404).json({ error: "Product not found" });
        case "P2003": // Foreign key constraint violation
          return res.status(409).json({
            error:
              "Cannot delete product because it is referenced in orders, cart, wishlist, or feedback",
          });
        default:
          console.error("Known Prisma error:", err);
          return res.status(500).json({ error: "Database request failed" });
      }
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
      return res.status(400).json({ error: "Invalid product ID format" });
    }

    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
});

export default router;
