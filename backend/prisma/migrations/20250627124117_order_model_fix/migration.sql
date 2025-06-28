/*
  Warnings:

  - Changed the type of `status` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `paymentMode` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `paymentStatus` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL,
ALTER COLUMN "paymentMode" SET NOT NULL,
ALTER COLUMN "paymentStatus" SET NOT NULL;
