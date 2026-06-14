-- DropIndex
DROP INDEX "reviews_userId_productId_key";

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "reviews_userId_productId_idx" ON "reviews"("userId", "productId");
