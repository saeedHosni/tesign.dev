-- DropIndex
DROP INDEX "orders_createdAt_idx";

-- DropIndex
DROP INDEX "products_createdAt_idx";

-- DropIndex
DROP INDEX "products_totalSales_idx";

-- DropIndex
DROP INDEX "project_leads_createdAt_idx";

-- AlterTable
ALTER TABLE "project_leads" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "services" ALTER COLUMN "icon" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "products_totalSales_idx" ON "products"("totalSales");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "project_leads_createdAt_idx" ON "project_leads"("createdAt");
