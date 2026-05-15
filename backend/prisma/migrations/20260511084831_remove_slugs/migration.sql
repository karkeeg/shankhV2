/*
  Warnings:

  - You are about to drop the column `slug` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `StudyPlan` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Topic` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- DropIndex
DROP INDEX "Activity_levelId_slug_key";

-- DropIndex
DROP INDEX "Level_topicId_difficulty_key";

-- DropIndex
DROP INDEX "Module_studyPlanId_slug_key";

-- DropIndex
DROP INDEX "StudyPlan_slug_key";

-- DropIndex
DROP INDEX "Topic_moduleId_slug_key";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "StudyPlan" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "Topic" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'user';
