-- AlterTable
ALTER TABLE "tiktok_gifts" ADD COLUMN     "payoutAmount" INTEGER,
ADD COLUMN     "payoutStatus" BOOLEAN DEFAULT false;
