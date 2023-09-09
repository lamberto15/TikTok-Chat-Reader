/*
  Warnings:

  - You are about to drop the `Gift` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Gift";

-- CreateTable
CREATE TABLE "tiktok_gifts" (
    "id" SERIAL NOT NULL,
    "msgId" TEXT NOT NULL,
    "giftId" INTEGER NOT NULL,
    "secUid" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "describe" TEXT NOT NULL,
    "giftName" TEXT NOT NULL,
    "giftType" INTEGER NOT NULL,
    "nickname" TEXT NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "diamondCount" INTEGER NOT NULL,
    "giftPictureUrl" TEXT NOT NULL,
    "receiverUserId" TEXT NOT NULL,
    "profilePictureUrl" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "gameId" INTEGER NOT NULL,

    CONSTRAINT "tiktok_gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "winner_id" TEXT,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tiktok_gifts" ADD CONSTRAINT "tiktok_gifts_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
