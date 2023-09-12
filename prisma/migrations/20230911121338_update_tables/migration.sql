/*
  Warnings:

  - You are about to drop the column `timestamp` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `winner_id` on the `games` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[msgId]` on the table `tiktok_gifts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "games" DROP COLUMN "timestamp",
DROP COLUMN "winner_id",
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tiktok_gifts" ADD COLUMN     "isWinner" BOOLEAN DEFAULT false;

-- CreateIndex
CREATE INDEX "games_created_at_idx" ON "games"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tiktok_gifts_msgId_key" ON "tiktok_gifts"("msgId");

-- CreateIndex
CREATE INDEX "tiktok_gifts_gameId_idx" ON "tiktok_gifts"("gameId");

-- CreateIndex
CREATE INDEX "tiktok_gifts_msgId_idx" ON "tiktok_gifts"("msgId");

-- CreateIndex
CREATE INDEX "tiktok_gifts_timestamp_idx" ON "tiktok_gifts"("timestamp");
