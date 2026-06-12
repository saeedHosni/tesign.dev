-- Migration: add_performance_indexes
-- این migration ایندکس‌هایی را اضافه می‌کند که برای بهبود کارایی query های رایج لازم هستند

-- products: فیلترهای رایج در لیست محصولات
CREATE INDEX IF NOT EXISTS "products_isActive_idx"    ON "products"("isActive");
CREATE INDEX IF NOT EXISTS "products_isFeatured_idx"  ON "products"("isFeatured");
CREATE INDEX IF NOT EXISTS "products_categoryId_idx"  ON "products"("categoryId");
CREATE INDEX IF NOT EXISTS "products_price_idx"       ON "products"("price");
CREATE INDEX IF NOT EXISTS "products_createdAt_idx"   ON "products"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "products_totalSales_idx"  ON "products"("totalSales" DESC);

-- orders: جستجو و فیلتر سفارشات
CREATE INDEX IF NOT EXISTS "orders_userId_idx"         ON "orders"("userId");
CREATE INDEX IF NOT EXISTS "orders_status_idx"         ON "orders"("status");
CREATE INDEX IF NOT EXISTS "orders_paymentStatus_idx"  ON "orders"("paymentStatus");
CREATE INDEX IF NOT EXISTS "orders_createdAt_idx"      ON "orders"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "orders_paidAt_idx"         ON "orders"("paidAt");

-- order_items: برای گزارشات فروش
CREATE INDEX IF NOT EXISTS "order_items_productId_idx" ON "order_items"("productId");
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx"   ON "order_items"("orderId");

-- reviews: فیلتر نظرات تأییدنشده
CREATE INDEX IF NOT EXISTS "reviews_productId_isApproved_idx" ON "reviews"("productId", "isApproved");
CREATE INDEX IF NOT EXISTS "reviews_isApproved_idx"           ON "reviews"("isApproved");

-- project_leads: فیلتر بر اساس وضعیت
CREATE INDEX IF NOT EXISTS "project_leads_status_idx"    ON "project_leads"("status");
CREATE INDEX IF NOT EXISTS "project_leads_createdAt_idx" ON "project_leads"("createdAt" DESC);

-- coupons: جستجو بر اساس کد و وضعیت
CREATE INDEX IF NOT EXISTS "coupons_isActive_idx"  ON "coupons"("isActive");
CREATE INDEX IF NOT EXISTS "coupons_expiresAt_idx" ON "coupons"("expiresAt");

-- cart_items: دسترسی سریع به آیتم‌های سبد
CREATE INDEX IF NOT EXISTS "cart_items_cartId_idx"    ON "cart_items"("cartId");
CREATE INDEX IF NOT EXISTS "cart_items_productId_idx" ON "cart_items"("productId");

-- wishlist: دسترسی سریع به wishlist کاربر
CREATE INDEX IF NOT EXISTS "wishlist_items_userId_idx" ON "wishlist_items"("userId");

-- order_downloads: جستجو با token
-- (token column already has UNIQUE INDEX which covers lookup needs)

-- refresh_tokens: cleanup expired tokens
CREATE INDEX IF NOT EXISTS "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_idx"    ON "refresh_tokens"("userId");
