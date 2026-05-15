-- CreateEnum
CREATE TYPE "ModuleStage" AS ENUM ('foundation', 'applied', 'integrated');

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "importableCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "skillTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "stage" "ModuleStage" NOT NULL DEFAULT 'foundation';
