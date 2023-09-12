/*
  Warnings:

  - The `status` column on the `games` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('done', 'invalid');

-- AlterTable
ALTER TABLE "games" DROP COLUMN "status",
ADD COLUMN     "status" "GameStatus";

-- DropEnum
DROP TYPE "Gender";
