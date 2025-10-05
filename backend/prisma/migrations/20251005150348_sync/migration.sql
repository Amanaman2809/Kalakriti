-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "discountApplied" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "discountPct" SMALLINT,
ADD COLUMN     "numReviews" INTEGER NOT NULL DEFAULT 0;
