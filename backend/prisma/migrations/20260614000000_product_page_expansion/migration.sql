-- Migration: Product Page Expansion
-- Adds ProductFeature, ProductFAQ, ProductChangelog, ProductStat models
-- for expanded product detail page

-- ─── Product Features ─────────────────────────────────────────────────────────
CREATE TABLE "product_features" (
    "id"          TEXT        NOT NULL,
    "productId"   TEXT        NOT NULL,
    "icon"        TEXT,
    "title"       TEXT        NOT NULL,
    "value"       TEXT,
    "sortOrder"   INTEGER     NOT NULL DEFAULT 0,

    CONSTRAINT "product_features_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_features_productId_idx" ON "product_features"("productId");

ALTER TABLE "product_features"
    ADD CONSTRAINT "product_features_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Product FAQs ─────────────────────────────────────────────────────────────
CREATE TABLE "product_faqs" (
    "id"          TEXT        NOT NULL,
    "productId"   TEXT        NOT NULL,
    "question"    TEXT        NOT NULL,
    "answer"      TEXT        NOT NULL,
    "sortOrder"   INTEGER     NOT NULL DEFAULT 0,

    CONSTRAINT "product_faqs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_faqs_productId_idx" ON "product_faqs"("productId");

ALTER TABLE "product_faqs"
    ADD CONSTRAINT "product_faqs_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Product Changelogs ───────────────────────────────────────────────────────
CREATE TABLE "product_changelogs" (
    "id"          TEXT        NOT NULL,
    "productId"   TEXT        NOT NULL,
    "version"     TEXT        NOT NULL,
    "title"       TEXT,
    "changes"     TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    "releasedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_changelogs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_changelogs_productId_idx" ON "product_changelogs"("productId");
CREATE INDEX "product_changelogs_releasedAt_idx" ON "product_changelogs"("releasedAt");

ALTER TABLE "product_changelogs"
    ADD CONSTRAINT "product_changelogs_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Product Stats ────────────────────────────────────────────────────────────
CREATE TABLE "product_stats" (
    "id"          TEXT        NOT NULL,
    "productId"   TEXT        NOT NULL,
    "label"       TEXT        NOT NULL,
    "value"       TEXT        NOT NULL,
    "icon"        TEXT,
    "sortOrder"   INTEGER     NOT NULL DEFAULT 0,

    CONSTRAINT "product_stats_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_stats_productId_idx" ON "product_stats"("productId");

ALTER TABLE "product_stats"
    ADD CONSTRAINT "product_stats_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
