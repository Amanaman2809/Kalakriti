-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('COD', 'ONLINE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'SHIPPED', 'DELIVERED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMode" "PaymentMode",
ADD COLUMN     "paymentStatus" "PaymentStatus";
