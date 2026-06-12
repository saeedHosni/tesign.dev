-- CreateTable: project_main_categories
CREATE TABLE "project_main_categories" (
    "id"          TEXT         NOT NULL,
    "key"         TEXT         NOT NULL,
    "title"       TEXT         NOT NULL,
    "description" TEXT,
    "icon"        TEXT,
    "sortOrder"   INTEGER      NOT NULL DEFAULT 0,
    "isActive"    BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_main_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_main_categories_key_key" ON "project_main_categories"("key");
CREATE INDEX "project_main_categories_isActive_idx" ON "project_main_categories"("isActive");
CREATE INDEX "project_main_categories_sortOrder_idx" ON "project_main_categories"("sortOrder");

-- CreateTable: project_subcategories
CREATE TABLE "project_subcategories" (
    "id"             TEXT         NOT NULL,
    "label"          TEXT         NOT NULL,
    "mainCategoryId" TEXT,
    "sortOrder"      INTEGER      NOT NULL DEFAULT 0,
    "isActive"       BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_subcategories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_subcategories_mainCategoryId_idx" ON "project_subcategories"("mainCategoryId");
CREATE INDEX "project_subcategories_isActive_idx" ON "project_subcategories"("isActive");

ALTER TABLE "project_subcategories"
    ADD CONSTRAINT "project_subcategories_mainCategoryId_fkey"
    FOREIGN KEY ("mainCategoryId")
    REFERENCES "project_main_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: budget_options
CREATE TABLE "budget_options" (
    "id"        TEXT         NOT NULL,
    "label"     TEXT         NOT NULL,
    "value"     TEXT         NOT NULL,
    "icon"      TEXT,
    "sortOrder" INTEGER      NOT NULL DEFAULT 0,
    "isActive"  BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "budget_options_value_key" ON "budget_options"("value");
CREATE INDEX "budget_options_isActive_idx" ON "budget_options"("isActive");
CREATE INDEX "budget_options_sortOrder_idx" ON "budget_options"("sortOrder");

-- CreateTable: timeline_options
CREATE TABLE "timeline_options" (
    "id"        TEXT         NOT NULL,
    "label"     TEXT         NOT NULL,
    "value"     TEXT         NOT NULL,
    "sortOrder" INTEGER      NOT NULL DEFAULT 0,
    "isActive"  BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "timeline_options_value_key" ON "timeline_options"("value");
CREATE INDEX "timeline_options_isActive_idx" ON "timeline_options"("isActive");
CREATE INDEX "timeline_options_sortOrder_idx" ON "timeline_options"("sortOrder");

-- CreateTable: price_estimate_rules
CREATE TABLE "price_estimate_rules" (
    "id"               TEXT         NOT NULL,
    "budgetOptionId"   TEXT,
    "timelineOptionId" TEXT,
    "minAmount"        INTEGER      NOT NULL,
    "maxAmount"        INTEGER      NOT NULL,
    "unit"             TEXT         NOT NULL DEFAULT 'میلیون تومان',
    "isActive"         BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_estimate_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_estimate_rules_budgetOptionId_idx"   ON "price_estimate_rules"("budgetOptionId");
CREATE INDEX "price_estimate_rules_timelineOptionId_idx" ON "price_estimate_rules"("timelineOptionId");
CREATE INDEX "price_estimate_rules_isActive_idx"         ON "price_estimate_rules"("isActive");

ALTER TABLE "price_estimate_rules"
    ADD CONSTRAINT "price_estimate_rules_budgetOptionId_fkey"
    FOREIGN KEY ("budgetOptionId")
    REFERENCES "budget_options"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "price_estimate_rules"
    ADD CONSTRAINT "price_estimate_rules_timelineOptionId_fkey"
    FOREIGN KEY ("timelineOptionId")
    REFERENCES "timeline_options"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Seed: داده‌های اولیه (همان مقادیر تصاویر) ─────────────────────────────

-- دسته‌بندی‌های اصلی
INSERT INTO "project_main_categories" ("id","key","title","description","icon","sortOrder","isActive","createdAt","updatedAt") VALUES
  (gen_random_uuid(), 'visual_identity',   'هویت بصری',          'لوگو، برندینگ، بنر و محتوای بصری',            '💎', 0, true, NOW(), NOW()),
  (gen_random_uuid(), 'ui_ux',             'UI/UX طراحی',         'رابط کاربری، تجربه کاربری، وایرفریم',          '🎨', 1, true, NOW(), NOW()),
  (gen_random_uuid(), 'web_design',        'طراحی وب‌سایت',       'وب‌سایت شرکتی، فروشگاهی، خبری و...',          '🌐', 2, true, NOW(), NOW()),
  (gen_random_uuid(), 'seo_optimization',  'سئو و بهینه‌سازی',    'سئو داخلی، خارجی، فنی و افزایش سرعت',         '📈', 3, true, NOW(), NOW()),
  (gen_random_uuid(), 'support',           'پشتیبانی و نگهداری',  'نگهداری ماهانه، آپدیت، رفع باگ',               '🔧', 4, true, NOW(), NOW());

-- زیردسته‌های نوع وب‌سایت (وابسته به web_design)
WITH mc AS (SELECT id FROM "project_main_categories" WHERE key = 'web_design')
INSERT INTO "project_subcategories" ("id","label","mainCategoryId","sortOrder","isActive","createdAt","updatedAt")
SELECT gen_random_uuid(), label, mc.id, ord, true, NOW(), NOW()
FROM mc, (VALUES
  ('وب‌سایت شرکتی / سازمانی', 0),
  ('فروشگاه اینترنتی (ووکامرس)', 1),
  ('وب‌سایت شخصی / پورتفولیو', 2),
  ('لندینگ‌پیج تبلیغاتی', 3),
  ('سایت خبری / مجله', 4),
  ('سایر', 5)
) AS v(label, ord);

-- بازه‌های بودجه
INSERT INTO "budget_options" ("id","label","value","icon","sortOrder","isActive","createdAt","updatedAt") VALUES
  (gen_random_uuid(), 'کمتر از ۲ میلیون',      'under_2m',   '💰',  0, true, NOW(), NOW()),
  (gen_random_uuid(), '۲ تا ۵ میلیون تومان',   '2m_5m',      '💰',  1, true, NOW(), NOW()),
  (gen_random_uuid(), '۵ تا ۱۰ میلیون تومان',  '5m_10m',     '💰💰', 2, true, NOW(), NOW()),
  (gen_random_uuid(), '۱۰ تا ۲۰ میلیون تومان', '10m_20m',    '💰💰', 3, true, NOW(), NOW()),
  (gen_random_uuid(), 'بیشتر از ۲۰ میلیون',    'over_20m',   '💰💰💰',4, true, NOW(), NOW()),
  (gen_random_uuid(), 'قابل مذاکره',           'negotiable',  '🤝',  5, true, NOW(), NOW());

-- بازه‌های زمانبندی
INSERT INTO "timeline_options" ("id","label","value","sortOrder","isActive","createdAt","updatedAt") VALUES
  (gen_random_uuid(), 'هرچه زودتر',       'asap',      0, true, NOW(), NOW()),
  (gen_random_uuid(), 'تا یک ماه',        '1m',        1, true, NOW(), NOW()),
  (gen_random_uuid(), '۱ تا ۲ ماه',       '1m_2m',     2, true, NOW(), NOW()),
  (gen_random_uuid(), '۲ تا ۳ ماه',       '2m_3m',     3, true, NOW(), NOW()),
  (gen_random_uuid(), 'زمانبندی انعطاف‌پذیر', 'flexible', 4, true, NOW(), NOW());

-- قانون پیش‌فرض تخمین (کلی، بدون فیلتر بودجه/زمانبندی)
INSERT INTO "price_estimate_rules" ("id","budgetOptionId","timelineOptionId","minAmount","maxAmount","unit","isActive","createdAt","updatedAt") VALUES
  (gen_random_uuid(), NULL, NULL, 8, 30, 'میلیون تومان', true, NOW(), NOW());
