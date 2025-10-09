-- AlterTable
ALTER TABLE "public"."OrderItem" ADD COLUMN     "discountApplied" INTEGER;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "discountPct" SMALLINT;
