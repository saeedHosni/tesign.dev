-- Migration: services_extend
-- اضافه کردن فیلدهای linkText و price به جدول services
-- همچنین اضافه کردن ایندکس برای sortOrder

ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "linkText" TEXT,
  ADD COLUMN IF NOT EXISTS "price"    TEXT;

-- ایندکس برای مرتب‌سازی خدمات
CREATE INDEX IF NOT EXISTS "services_sortOrder_idx" ON "services"("sortOrder");
CREATE INDEX IF NOT EXISTS "services_isActive_idx"  ON "services"("isActive");