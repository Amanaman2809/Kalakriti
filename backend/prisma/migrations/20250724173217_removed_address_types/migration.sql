/*
  Warnings:

  - You are about to drop the column `type` on the `Address` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "type";

-- DropEnum
DROP TYPE "AddressType";
