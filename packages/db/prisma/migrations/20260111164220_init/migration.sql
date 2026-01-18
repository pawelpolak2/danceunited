/*
  Warnings:

  - The `duration` column on the `class_template` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "class_template" ADD COLUMN     "is_restricted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
DROP COLUMN "duration",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 3600;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "recurrence_group_id" UUID,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "dance_style" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "package" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "payment" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "user_purchase" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
