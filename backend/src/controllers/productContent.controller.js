// src/controllers/productContent.controller.js
// مدیریت محتوای گسترده صفحه محصول:
//   - امکانات (features)
//   - سوالات متداول (faqs)
//   - تاریخچه تغییرات (changelogs)
//   - آمار نمایشی (stats)

import prisma from '../config/db.js';

// ── Helper ────────────────────────────────────────────────────────────────────

async function findProductOrFail(productId, res) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    return null;
  }
  return product;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT FEATURES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/products/:id/features
export const getProductFeatures = async (req, res, next) => {
  try {
    const features = await prisma.productFeature.findMany({
      where: { productId: req.params.id },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: features });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:id/features  [Admin]
export const addProductFeature = async (req, res, next) => {
  try {
    const { icon, title, value, sortOrder } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'عنوان امکان الزامی است.' });
    }

    const product = await findProductOrFail(req.params.id, res);
    if (!product) return;

    const feature = await prisma.productFeature.create({
      data: {
        productId: req.params.id,
        icon:      icon      || null,
        title,
        value:     value     || null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    res.status(201).json({ success: true, message: 'امکان اضافه شد.', data: feature });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id/features/:featureId  [Admin]
export const updateProductFeature = async (req, res, next) => {
  try {
    const existing = await prisma.productFeature.findFirst({
      where: { id: req.params.featureId, productId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'امکان یافت نشد.' });
    }

    const { icon, title, value, sortOrder } = req.body;
    const updates = {};
    if (icon      !== undefined) updates.icon      = icon;
    if (title     !== undefined) updates.title     = title;
    if (value     !== undefined) updates.value     = value;
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);

    const feature = await prisma.productFeature.update({
      where: { id: req.params.featureId },
      data: updates,
    });

    res.json({ success: true, message: 'امکان بروز شد.', data: feature });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id/features/:featureId  [Admin]
export const deleteProductFeature = async (req, res, next) => {
  try {
    const existing = await prisma.productFeature.findFirst({
      where: { id: req.params.featureId, productId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'امکان یافت نشد.' });
    }

    await prisma.productFeature.delete({ where: { id: req.params.featureId } });
    res.json({ success: true, message: 'امکان حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id/features/reorder  [Admin]
// body: { items: [{ id, sortOrder }, ...] }
export const reorderProductFeatures = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'آرایه items الزامی است.' });
    }

    await prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        prisma.productFeature.update({
          where: { id },
          data: { sortOrder: Number(sortOrder) },
        })
      )
    );

    res.json({ success: true, message: 'ترتیب امکانات بروز شد.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT FAQs
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/products/:id/faqs
export const getProductFAQs = async (req, res, next) => {
  try {
    const faqs = await prisma.productFAQ.findMany({
      where: { productId: req.params.id },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: faqs });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:id/faqs  [Admin]
export const addProductFAQ = async (req, res, next) => {
  try {
    const { question, answer, sortOrder } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'سوال و جواب الزامی است.' });
    }

    const product = await findProductOrFail(req.params.id, res);
    if (!product) return;

    const faq = await prisma.productFAQ.create({
      data: {
        productId: req.params.id,
        question:  String(question).slice(0, 500),
        answer:    String(answer).slice(0, 3000),
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    res.status(201).json({ success: true, message: 'سوال متداول اضافه شد.', data: faq });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id/faqs/:faqId  [Admin]
export const updateProductFAQ = async (req, res, next) => {
  try {
    const existing = await prisma.productFAQ.findFirst({
      where: { id: req.params.faqId, productId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'سوال یافت نشد.' });
    }

    const { question, answer, sortOrder } = req.body;
    const updates = {};
    if (question  !== undefined) updates.question  = String(question).slice(0, 500);
    if (answer    !== undefined) updates.answer    = String(answer).slice(0, 3000);
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);

    const faq = await prisma.productFAQ.update({
      where: { id: req.params.faqId },
      data: updates,
    });

    res.json({ success: true, message: 'سوال متداول بروز شد.', data: faq });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id/faqs/:faqId  [Admin]
export const deleteProductFAQ = async (req, res, next) => {
  try {
    const existing = await prisma.productFAQ.findFirst({
      where: { id: req.params.faqId, productId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'سوال یافت نشد.' });
    }

    await prisma.productFAQ.delete({ where: { id: req.params.faqId } });
    res.json({ success: true, message: 'سوال متداول حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id/faqs/reorder  [Admin]
export const reorderProductFAQs = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'آرایه items الزامی است.' });
    }

    await prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        prisma.productFAQ.update({
          where: { id },
          data: { sortOrder: Number(sortOrder) },
        })
      )
    );

    res.json({ success: true, message: 'ترتیب سوالات بروز شد.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CHANGELOGS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/products/:id/changelogs
export const getProductChangelogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [changelogs, total] = await Promise.all([
      prisma.productChangelog.findMany({
        where: { productId: req.params.id },
        orderBy: { releasedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.productChangelog.count({ where: { productId: req.params.id } }),
    ]);

    res.json({
      success: true,
      data: changelogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:id/changelogs  [Admin]
export const addProductChangelog = async (req, res, next) => {
  try {
    const { version, title, changes, releasedAt } = req.body;

    if (!version) {
      return res.status(400).json({ success: false, message: 'شماره نسخه الزامی است.' });
    }

    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ success: false, message: 'حداقل یک تغییر باید ذکر شود.' });
    }

    const product = await findProductOrFail(req.params.id, res);
    if (!product) return;

    const changelog = await prisma.productChangelog.create({
      data: {
        productId:  req.params.id,
        version:    String(version).slice(0, 50),
        title:      title ? String(title).slice(0, 200) : null,
        changes:    changes.map(c => String(c).slice(0, 500)),
        releasedAt: releasedAt ? new Date(releasedAt) : new Date(),
      },
    });

    res.status(201).json({ success: true, message: 'تغییرات نسخه اضافه شد.', data: changelog });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id/changelogs/:changelogId  [Admin]
export const updateProductChangelog = async (req, res, next) => {
  try {
    const existing = await prisma.productChangelog.findFirst({
      where: { id: req.params.changelogId, productId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'تغییرات نسخه یافت نشد.' });
    }

    const { version, title, changes, releasedAt } = req.body;
    const updates = {};
    if (version    !== undefined) updates.version    = String(version).slice(0, 50);
    if (title      !== undefined) updates.title      = title ? String(title).slice(0, 200) : null;
    if (changes    !== undefined) updates.changes    = changes.map(c => String(c).slice(0, 500));
    if (releasedAt !== undefined) updates.releasedAt = new Date(releasedAt);

    const changelog = await prisma.productChangelog.update({
      where: { id: req.params.changelogId },
      data: updates,
    });

    res.json({ success: true, message: 'تغییرات نسخه بروز شد.', data: changelog });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id/changelogs/:changelogId  [Admin]
export const deleteProductChangelog = async (req, res, next) => {
  try {
    const existing = await prisma.productChangelog.findFirst({
      where: { id: req.params.changelogId, productId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'تغییرات نسخه یافت نشد.' });
    }

    await prisma.productChangelog.delete({ where: { id: req.params.changelogId } });
    res.json({ success: true, message: 'تغییرات نسخه حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT STATS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/products/:id/stats
export const getProductStats = async (req, res, next) => {
  try {
    const stats = await prisma.productStat.findMany({
      where: { productId: req.params.id },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:id/stats  [Admin]
export const addProductStat = async (req, res, next) => {
  try {
    const { label, value, icon, sortOrder } = req.body;

    if (!label || !value) {
      return res.status(400).json({ success: false, message: 'برچسب و مقدار الزامی است.' });
    }

    const product = await findProductOrFail(req.params.id, res);
    if (!product) return;

    const stat = await prisma.productStat.create({
      data: {
        productId: req.params.id,
        label:     String(label).slice(0, 200),
        value:     String(value).slice(0, 100),
        icon:      icon || null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    res.status(201).json({ success: true, message: 'آمار اضافه شد.', data: stat });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id/stats/:statId  [Admin]
export const updateProductStat = async (req, res, next) => {
  try {
    const existing = await prisma.productStat.findFirst({
      where: { id: req.params.statId, productId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'آمار یافت نشد.' });
    }

    const { label, value, icon, sortOrder } = req.body;
    const updates = {};
    if (label     !== undefined) updates.label     = String(label).slice(0, 200);
    if (value     !== undefined) updates.value     = String(value).slice(0, 100);
    if (icon      !== undefined) updates.icon      = icon;
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);

    const stat = await prisma.productStat.update({
      where: { id: req.params.statId },
      data: updates,
    });

    res.json({ success: true, message: 'آمار بروز شد.', data: stat });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id/stats/:statId  [Admin]
export const deleteProductStat = async (req, res, next) => {
  try {
    const existing = await prisma.productStat.findFirst({
      where: { id: req.params.statId, productId: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'آمار یافت نشد.' });
    }

    await prisma.productStat.delete({ where: { id: req.params.statId } });
    res.json({ success: true, message: 'آمار حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id/stats/reorder  [Admin]
export const reorderProductStats = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'آرایه items الزامی است.' });
    }

    await prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        prisma.productStat.update({
          where: { id },
          data: { sortOrder: Number(sortOrder) },
        })
      )
    );

    res.json({ success: true, message: 'ترتیب آمارها بروز شد.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK SYNC (Admin helper)
// PUT /api/products/:id/content
// یک endpoint برای ذخیره همزمان همه محتوا از پنل ادمین
// ─────────────────────────────────────────────────────────────────────────────

export const syncProductContent = async (req, res, next) => {
  try {
    const { features, faqs, changelogs, stats } = req.body;

    const product = await findProductOrFail(req.params.id, res);
    if (!product) return;

    await prisma.$transaction(async (tx) => {
      // Features
      if (Array.isArray(features)) {
        await tx.productFeature.deleteMany({ where: { productId: req.params.id } });
        if (features.length > 0) {
          await tx.productFeature.createMany({
            data: features.map((f, i) => ({
              productId: req.params.id,
              icon:      f.icon      || null,
              title:     String(f.title || '').slice(0, 200),
              value:     f.value     || null,
              sortOrder: f.sortOrder ?? i,
            })),
          });
        }
      }

      // FAQs
      if (Array.isArray(faqs)) {
        await tx.productFAQ.deleteMany({ where: { productId: req.params.id } });
        if (faqs.length > 0) {
          await tx.productFAQ.createMany({
            data: faqs.map((f, i) => ({
              productId: req.params.id,
              question:  String(f.question || '').slice(0, 500),
              answer:    String(f.answer   || '').slice(0, 3000),
              sortOrder: f.sortOrder ?? i,
            })),
          });
        }
      }

      // Stats
      if (Array.isArray(stats)) {
        await tx.productStat.deleteMany({ where: { productId: req.params.id } });
        if (stats.length > 0) {
          await tx.productStat.createMany({
            data: stats.map((s, i) => ({
              productId: req.params.id,
              label:     String(s.label || '').slice(0, 200),
              value:     String(s.value || '').slice(0, 100),
              icon:      s.icon || null,
              sortOrder: s.sortOrder ?? i,
            })),
          });
        }
      }
      // Note: changelogs are NOT bulk-replaced (they are historical records)
    });

    res.json({ success: true, message: 'محتوای محصول ذخیره شد.' });
  } catch (error) {
    next(error);
  }
};
