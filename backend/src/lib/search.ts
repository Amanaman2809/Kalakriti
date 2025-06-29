import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient();

export async function searchProducts(
  query: string,
  minPrice?: number,
  maxPrice?: number,
  page: number = 1,
  limit: number = 20,
) {
  const skip = (page - 1) * limit;

  const products = await prisma.product.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        ...(minPrice !== undefined ? [{ price: { gte: minPrice } }] : []),
        ...(maxPrice !== undefined ? [{ price: { lte: maxPrice } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" }, // Optional, depends on UX
    skip,
    take: limit,
  });

  return products;
}
