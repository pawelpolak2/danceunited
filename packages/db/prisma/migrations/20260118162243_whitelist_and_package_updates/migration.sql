/*
  Warnings:

  - You are about to drop the column `is_restricted` on the `class_template` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence_group_id` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `class_template_id` on the `package` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PackageCategory" AS ENUM ('YOUTH', 'KIDS', 'SPORT', 'ADULTS', 'UNIVERSAL');

-- DropForeignKey
ALTER TABLE "package" DROP CONSTRAINT "package_class_template_id_fkey";

-- AlterTable
ALTER TABLE "class_template" DROP COLUMN "is_restricted",
ADD COLUMN     "is_whitelist_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "classes" DROP COLUMN "notes",
DROP COLUMN "recurrence_group_id",
ALTER COLUMN "actual_hall" SET DEFAULT 'HALL1';

-- AlterTable
ALTER TABLE "package" DROP COLUMN "class_template_id",
ADD COLUMN     "category" "PackageCategory" NOT NULL DEFAULT 'UNIVERSAL',
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_individual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "class_count" SET DEFAULT 1;

-- CreateTable
CREATE TABLE "class_whitelist" (
    "user_id" UUID NOT NULL,
    "class_template_id" UUID NOT NULL,

    CONSTRAINT "class_whitelist_pkey" PRIMARY KEY ("user_id","class_template_id")
);

-- CreateTable
CREATE TABLE "class_template_to_package" (
    "class_template_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,

    CONSTRAINT "class_template_to_package_pkey" PRIMARY KEY ("class_template_id","package_id")
);

-- AddForeignKey
ALTER TABLE "class_whitelist" ADD CONSTRAINT "class_whitelist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_whitelist" ADD CONSTRAINT "class_whitelist_class_template_id_fkey" FOREIGN KEY ("class_template_id") REFERENCES "class_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_template_to_package" ADD CONSTRAINT "class_template_to_package_class_template_id_fkey" FOREIGN KEY ("class_template_id") REFERENCES "class_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_template_to_package" ADD CONSTRAINT "class_template_to_package_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
