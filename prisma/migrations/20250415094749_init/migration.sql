-- CreateTable
CREATE TABLE "Emoji" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prompt" TEXT NOT NULL,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "originalUrl" TEXT,
    "noBackgroundUrl" TEXT,
    "safetyRating" INTEGER NOT NULL,
    "error" TEXT,

    CONSTRAINT "Emoji_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Emoji_isFlagged_originalUrl_noBackgroundUrl_idx" ON "Emoji"("isFlagged", "originalUrl", "noBackgroundUrl");

-- CreateIndex
CREATE INDEX "Emoji_prompt_idx" ON "Emoji"("prompt");
