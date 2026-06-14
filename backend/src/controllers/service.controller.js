// src/controllers/service.controller.js
import prisma from '../config/db.js';
import slugify from 'slugify';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * تولید slug یکتا از عنوان
 * اگر customSlug داده شود، همان را یکتا می‌کند
 */
async function buildUniqueSlug(title, customSlug = null, excludeId = null) {
  const base = customSlug
    ? customSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    : slugify(title, { locale: 'fa', lower: true, strict: true }) || `service-${Date.now()}`;

  let slug = base;
  let counter = 1;

  while (true) {
    const found = await prisma.service.findUnique({ where: { slug } });
    if (!found || found.id === excludeId) break;
    slug = `${base}-${counter++}`;
  }

  return slug;
}

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * GET /api/services
 * پارامتر اختیاری: ?admin=1 — همه خدمات (فعال و غیرفعال) برای پنل ادمین
 */
export const getServices = async (req, res, next) => {
  try {
    const isAdmin = req.query.admin === '1';
    const where   = isAdmin ? {} : { isActive: true };

    const services = await prisma.service.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        features: { orderBy: { sortOrder: 'asc' } },
        _count:   { select: { projectLeads: true } },
      },
    });

    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/services/:slug
 * دریافت یک سرویس با slug (فقط فعال‌ها برای عموم)
 */
export const getService = async (req, res, next) => {
  try {
    const service = await prisma.service.findFirst({
      where:   { slug: req.params.slug, isActive: true },
      include: { features: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'سرویس یافت نشد.' });
    }

    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: CRUD ──────────────────────────────────────────────────────────────

/**
 * POST /api/services  [Admin]
 *
 * Body:
 *   title*       string   — عنوان سرویس
 *   category*    string   — دسته‌بندی (نمایشی)
 *   slug?        string   — اگر خالی باشد از عنوان تولید می‌شود
 *   icon?        string   — emoji یا URL تصویر
 *   description? string   — توضیحات
 *   linkText?    string   — متن دکمه/لینک («مشاوره رایگان» و...)
 *   price?       string   — قیمت نمایشی («از ۵ میلیون تومان»)
 *   sortOrder?   number   — ترتیب نمایش
 *   isActive?    boolean  — وضعیت (پیش‌فرض: true)
 *   features?    string[] — آیتم‌های سرویس
 */
export const createService = async (req, res, next) => {
  try {
    const {
      icon, category, title, description,
      linkText, price, features, sortOrder, isActive, slug: customSlug,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'عنوان و دسته سرویس الزامی است.' });
    }

    const slug = await buildUniqueSlug(title, customSlug);

    const service = await prisma.service.create({
      data: {
        slug,
        icon:        icon        ?? null,
        category,
        title,
        description: description ?? null,
        linkText:    linkText    ?? null,
        price:       price       ?? null,
        sortOrder:   sortOrder   ?? 0,
        isActive:    isActive    !== undefined ? Boolean(isActive) : true,
        features: {
          create: (features ?? []).map((label, i) => ({ label, sortOrder: i })),
        },
      },
      include: { features: { orderBy: { sortOrder: 'asc' } } },
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/services/:id  [Admin]
 *
 * همه فیلدها اختیاری — فقط فیلدهای ارسال‌شده آپدیت می‌شوند.
 * اگر features ارسال شود، لیست قبلی کاملاً جایگزین می‌شود.
 */
export const updateService = async (req, res, next) => {
  try {
    const {
      icon, category, title, description,
      linkText, price, isActive, sortOrder, features, slug: customSlug,
    } = req.body;

    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'سرویس یافت نشد.' });
    }

    const updates = {};
    if (icon        !== undefined) updates.icon        = icon;
    if (category    !== undefined) updates.category    = category;
    if (title       !== undefined) updates.title       = title;
    if (description !== undefined) updates.description = description;
    if (linkText    !== undefined) updates.linkText    = linkText;
    if (price       !== undefined) updates.price       = price;
    if (isActive    !== undefined) updates.isActive    = Boolean(isActive);
    if (sortOrder   !== undefined) updates.sortOrder   = Number(sortOrder);

    // اگر slug یا title تغییر کرده، slug جدید تولید کن
    const needsNewSlug =
      (customSlug !== undefined && customSlug !== existing.slug) ||
      (title !== undefined && title !== existing.title && !customSlug);

    if (needsNewSlug) {
      updates.slug = await buildUniqueSlug(
        title ?? existing.title,
        customSlug ?? null,
        req.params.id,
      );
    }

    const service = await prisma.$transaction(async (tx) => {
      await tx.service.update({ where: { id: req.params.id }, data: updates });

      if (features !== undefined) {
        await tx.serviceFeature.deleteMany({ where: { serviceId: req.params.id } });
        if (features.length > 0) {
          await tx.serviceFeature.createMany({
            data: features.map((label, i) => ({
              serviceId: req.params.id,
              label,
              sortOrder: i,
            })),
          });
        }
      }

      return tx.service.findUnique({
        where:   { id: req.params.id },
        include: { features: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/services/:id/toggle  [Admin]
 * تغییر وضعیت فعال/غیرفعال سرویس
 */
export const toggleService = async (req, res, next) => {
  try {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'سرویس یافت نشد.' });
    }

    const service = await prisma.service.update({
      where: { id: req.params.id },
      data:  { isActive: !existing.isActive },
    });

    res.json({
      success: true,
      message: service.isActive ? 'سرویس فعال شد.' : 'سرویس غیرفعال شد.',
      data:    service,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/services/:id  [Admin]
 * حذف نرم (soft delete) — سرویس غیرفعال می‌شود
 *
 * برای حذف کامل از: DELETE /api/services/:id?hard=1
 */
export const deleteService = async (req, res, next) => {
  try {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'سرویس یافت نشد.' });
    }

    const hard = req.query.hard === '1';

    if (hard) {
      // حذف کامل — serviceFeature به صورت cascade حذف می‌شود
      await prisma.service.delete({ where: { id: req.params.id } });
      return res.json({ success: true, message: 'سرویس به طور کامل حذف شد.' });
    }

    // حذف نرم — فقط غیرفعال می‌کنیم
    await prisma.service.update({
      where: { id: req.params.id },
      data:  { isActive: false },
    });

    res.json({ success: true, message: 'سرویس غیرفعال شد.' });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Reorder ───────────────────────────────────────────────────────────

/**
 * PATCH /api/services/reorder  [Admin]
 *
 * Body:
 *   items: Array<{ id: string, sortOrder: number }>
 *
 * مثال:
 *   { items: [{ id: "abc", sortOrder: 0 }, { id: "def", sortOrder: 1 }] }
 */
export const reorderServices = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'آرایه items الزامی است.' });
    }

    // اعتبارسنجی: همه id ها باید وجود داشته باشند
    const ids       = items.map((i) => i.id);
    const existing  = await prisma.service.findMany({ where: { id: { in: ids } }, select: { id: true } });
    const foundIds  = new Set(existing.map((s) => s.id));
    const missing   = ids.filter((id) => !foundIds.has(id));

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `سرویس‌های زیر یافت نشدند: ${missing.join(', ')}`,
      });
    }

    // آپدیت sortOrder در یک transaction
    await prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        prisma.service.update({ where: { id }, data: { sortOrder: Number(sortOrder) } }),
      ),
    );

    // برگرداندن لیست مرتب‌شده
    const services = await prisma.service.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { features: { orderBy: { sortOrder: 'asc' } } },
    });

    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};