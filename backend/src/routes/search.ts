import express from "express";
import { searchProducts } from "../lib/search";
import { PrismaClient } from "../generated/prisma";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const query = (req.query.q as string | undefined) || "";
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  // Validate pagination and price filters
  if (
    (minPrice !== undefined && isNaN(minPrice)) ||
    (maxPrice !== undefined && isNaN(maxPrice)) ||
    isNaN(page) ||
    page < 1 ||
    isNaN(limit) ||
    limit < 1
  ) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  try {
    const products = await searchProducts(
      query,
      minPrice,
      maxPrice,
      page,
      limit
    );
    const hasMore = products.length === limit;

    res.json({ products, hasMore });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// Autocomplete Endpoint
router.get("/autocomplete", async (req, res) => {
  const query = req.query.q as string;

  if (!query) {
    res.status(400).json({ error: "Query too short" });
    return;
  }

  try {
    const results = await prisma.product.findMany({
      where: {
        name: {
          startsWith: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 10,
    });

    res.json(results);
  } catch (err) {
    console.error("Autocomplete error:", err);
    res.status(500).json({ error: "Autocomplete failed" });
  }
});

export default router;
