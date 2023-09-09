-- DropForeignKey
ALTER TABLE "tiktok_gifts" DROP CONSTRAINT "tiktok_gifts_gameId_fkey";

-- AlterTable
ALTER TABLE "tiktok_gifts" ALTER COLUMN "gameId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tiktok_gifts" ADD CONSTRAINT "tiktok_gifts_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
