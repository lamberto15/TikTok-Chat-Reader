-- CreateTable
CREATE TABLE "Gift" (
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
    "timestamp" TIMESTAMP(3) NOT NULL,
    "diamondCount" INTEGER NOT NULL,
    "giftPictureUrl" TEXT NOT NULL,
    "receiverUserId" TEXT NOT NULL,
    "profilePictureUrl" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);
