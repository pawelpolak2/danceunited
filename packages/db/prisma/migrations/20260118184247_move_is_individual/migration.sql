/*
  Warnings:

  - You are about to drop the column `is_individual` on the `package` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "class_template" ADD COLUMN     "is_individual" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "package" DROP COLUMN "is_individual";
