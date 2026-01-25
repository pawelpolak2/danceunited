/*
  Warnings:

  - The values [SCHEDULED,COMPLETED] on the enum `ClassStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ClassStatus_new" AS ENUM ('ACTIVE', 'CANCELLED');
ALTER TABLE "public"."classes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "classes" ALTER COLUMN "status" TYPE "ClassStatus_new" USING ("status"::text::"ClassStatus_new");
ALTER TYPE "ClassStatus" RENAME TO "ClassStatus_old";
ALTER TYPE "ClassStatus_new" RENAME TO "ClassStatus";
DROP TYPE "public"."ClassStatus_old";
ALTER TABLE "classes" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "classes" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
