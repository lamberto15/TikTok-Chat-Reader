-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('done', 'invalid');

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "status" "Gender";
