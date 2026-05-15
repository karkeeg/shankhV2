-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'mcq';
ALTER TYPE "ActivityType" ADD VALUE 'decision';
ALTER TYPE "ActivityType" ADD VALUE 'lesson';
ALTER TYPE "ActivityType" ADD VALUE 'aiPack';

-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "checkCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hintsUsedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "caseContext" TEXT,
ADD COLUMN     "learningObjective" TEXT;
