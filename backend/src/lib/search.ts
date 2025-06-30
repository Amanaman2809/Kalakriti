import { PrismaClient, Prisma } from "../generated/prisma/client";

const prisma = new PrismaClient();

export async function searchProducts(
  query: string,
  minPrice?: number,
  maxPrice?: number,
  page: number = 1,
  limit: number = 20,
) {
  const skip = (page - 1) * limit;

  // Build AND conditions safely
  const andConditions: Prisma.ProductWhereInput[] = [];

  if (query.trim()) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: query,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          description: {
            contains: query,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          tags: {
            hasSome: [query], // looser
          },
        },
      ],
    });
  }

  if (minPrice !== undefined) {
    andConditions.push({ price: { gte: minPrice } });
  }

  if (maxPrice !== undefined) {
    andConditions.push({ price: { lte: maxPrice } });
  }

  // Only attach `AND` if it's non-empty
  const where: Prisma.ProductWhereInput | undefined =
    andConditions.length > 0 ? { AND: andConditions } : undefined;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return products;
}
