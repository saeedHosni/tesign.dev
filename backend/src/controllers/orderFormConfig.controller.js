// src/controllers/orderFormConfig.controller.js
//
// مدیریت کامل گزینه‌های فرم «ثبت سفارش» توسط ادمین:
//   - دسته‌بندی‌های اصلی نوع پروژه (مرحله ۱)
//   - زیردسته‌های مرتبط (اختیاری)
//   - بازه‌های بودجه تقریبی (مرحله ۲)
//   - بازه‌های زمانبندی مورد نظر (مرحله ۲)
//   - قوانین تخمین اولیه قیمت بر اساس ترکیب بودجه/زمانبندی
//
// همچنین یک endpoint عمومی (بدون نیاز به لاگین) برای دریافت گزینه‌های فعال
// و محاسبه‌ی تخمین قیمت — مورد نیاز فرانت برای رندر فرم.

import prisma from '../config/db.js';

const notFound = (res, message = 'مورد یافت نشد.') =>
  res.status(404).json({ success: false, message });

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });

// ──────────────────────────────────────────────────────────────────────────
// Helper: generic reorder — body: { items: [{ id, sortOrder }, ...] }
// ──────────────────────────────────────────────────────────────────────────
const reorderModel = (model) => async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return badRequest(res, 'آرایه‌ای از آیتم‌ها با id و sortOrder الزامی است.');
    }

    for (const item of items) {
      if (!item || typeof item.id !== 'string' || !Number.isFinite(Number(item.sortOrder))) {
        return badRequest(res, 'هر آیتم باید id و sortOrder معتبر داشته باشد.');
      }
    }

    await prisma.$transaction(
      items.map((item) =>
        model.update({
          where: { id: item.id },
          data: { sortOrder: Number(item.sortOrder) },
        })
      )
    );

    res.json({ success: true, message: 'ترتیب با موفقیت بروزرسانی شد.' });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// PROJECT MAIN CATEGORIES — دسته‌بندی اصلی نوع پروژه
// ══════════════════════════════════════════════════════════════════════════

// GET /api/admin/order-config/main-categories
export const getMainCategories = async (req, res, next) => {
  try {
    const categories = await prisma.projectMainCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        subcategories: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { subcategories: true } },
      },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/order-config/main-categories
export const createMainCategory = async (req, res, next) => {
  try {
    const { key, title, description, icon, sortOrder, isActive } = req.body;

    if (!key || !title) {
      return badRequest(res, 'فیلدهای key و title الزامی هستند.');
    }

    const existing = await prisma.projectMainCategory.findUnique({ where: { key } });
    if (existing) {
      return badRequest(res, 'دسته‌بندی‌ای با این key از قبل وجود دارد.');
    }

    const category = await prisma.projectMainCategory.create({
      data: {
        key,
        title,
        description: description ?? null,
        icon: icon ?? null,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        isActive: isActive !== false,
      },
    });

    res.status(201).json({ success: true, message: 'دسته‌بندی ایجاد شد.', data: category });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/order-config/main-categories/:id
export const updateMainCategory = async (req, res, next) => {
  try {
    const existing = await prisma.projectMainCategory.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res, 'دسته‌بندی یافت نشد.');

    const { key, title, description, icon, sortOrder, isActive } = req.body;

    if (key !== undefined && key !== existing.key) {
      const dup = await prisma.projectMainCategory.findUnique({ where: { key } });
      if (dup) return badRequest(res, 'دسته‌بندی‌ای با این key از قبل وجود دارد.');
    }

    const updates = {};
    if (key         !== undefined) updates.key         = key;
    if (title       !== undefined) updates.title       = title;
    if (description !== undefined) updates.description = description;
    if (icon        !== undefined) updates.icon        = icon;
    if (sortOrder   !== undefined) updates.sortOrder   = Number(sortOrder);
    if (isActive    !== undefined) updates.isActive    = !!isActive;

    if (Object.keys(updates).length === 0) {
      return badRequest(res, 'هیچ فیلدی برای بروزرسانی ارسال نشده.');
    }

    const category = await prisma.projectMainCategory.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json({ success: true, message: 'دسته‌بندی بروزرسانی شد.', data: category });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/order-config/main-categories/:id
export const deleteMainCategory = async (req, res, next) => {
  try {
    const existing = await prisma.projectMainCategory.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res, 'دسته‌بندی یافت نشد.');

    // زیردسته‌های مرتبط با این دسته نیز با کسکید حذف می‌شوند
    await prisma.projectMainCategory.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'دسته‌بندی حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/order-config/main-categories/reorder
export const reorderMainCategories = reorderModel(prisma.projectMainCategory);

// ══════════════════════════════════════════════════════════════════════════
// PROJECT SUBCATEGORIES — زیردسته‌های مرتبط (اختیاری)
// ══════════════════════════════════════════════════════════════════════════

// GET /api/admin/order-config/subcategories?mainCategoryId=...
export const getSubcategories = async (req, res, next) => {
  try {
    const { mainCategoryId } = req.query;
    const where = {};
    if (mainCategoryId === 'null' || mainCategoryId === '') {
      where.mainCategoryId = null;
    } else if (mainCategoryId) {
      where.mainCategoryId = mainCategoryId;
    }

    const subcategories = await prisma.projectSubcategory.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { mainCategory: { select: { id: true, title: true, key: true } } },
    });

    res.json({ success: true, data: subcategories });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/order-config/subcategories
export const createSubcategory = async (req, res, next) => {
  try {
    const { label, mainCategoryId, sortOrder, isActive } = req.body;

    if (!label) return badRequest(res, 'فیلد label الزامی است.');

    if (mainCategoryId) {
      const parent = await prisma.projectMainCategory.findUnique({ where: { id: mainCategoryId } });
      if (!parent) return badRequest(res, 'دسته‌بندی اصلی یافت نشد.');
    }

    const subcategory = await prisma.projectSubcategory.create({
      data: {
        label,
        mainCategoryId: mainCategoryId || null,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        isActive: isActive !== false,
      },
    });

    res.status(201).json({ success: true, message: 'زیردسته ایجاد شد.', data: subcategory });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/order-config/subcategories/:id
export const updateSubcategory = async (req, res, next) => {
  try {
    const existing = await prisma.projectSubcategory.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res, 'زیردسته یافت نشد.');

    const { label, mainCategoryId, sortOrder, isActive } = req.body;

    if (mainCategoryId) {
      const parent = await prisma.projectMainCategory.findUnique({ where: { id: mainCategoryId } });
      if (!parent) return badRequest(res, 'دسته‌بندی اصلی یافت نشد.');
    }

    const updates = {};
    if (label          !== undefined) updates.label          = label;
    if (mainCategoryId !== undefined) updates.mainCategoryId  = mainCategoryId || null;
    if (sortOrder      !== undefined) updates.sortOrder       = Number(sortOrder);
    if (isActive       !== undefined) updates.isActive        = !!isActive;

    if (Object.keys(updates).length === 0) {
      return badRequest(res, 'هیچ فیلدی برای بروزرسانی ارسال نشده.');
    }

    const subcategory = await prisma.projectSubcategory.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json({ success: true, message: 'زیردسته بروزرسانی شد.', data: subcategory });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/order-config/subcategories/:id
export const deleteSubcategory = async (req, res, next) => {
  try {
    const existing = await prisma.projectSubcategory.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res, 'زیردسته یافت نشد.');

    await prisma.projectSubcategory.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'زیردسته حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/order-config/subcategories/reorder
export const reorderSubcategories = reorderModel(prisma.projectSubcategory);

// ══════════════════════════════════════════════════════════════════════════
// BUDGET OPTIONS — بازه بودجه تقریبی
// ══════════════════════════════════════════════════════════════════════════

// GET /api/admin/order-config/budget-options
export const getBudgetOptions = async (req, res, next) => {
  try {
    const options = await prisma.budgetOption.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: options });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/order-config/budget-options
export const createBudgetOption = async (req, res, next) => {
  try {
    const { label, value, icon, sortOrder, isActive } = req.body;

    if (!label || !value) return badRequest(res, 'فیلدهای label و value الزامی هستند.');

    const existing = await prisma.budgetOption.findUnique({ where: { value } });
    if (existing) return badRequest(res, 'گزینه‌ای با این value از قبل وجود دارد.');

    const option = await prisma.budgetOption.create({
      data: {
        label,
        value,
        icon: icon ?? null,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        isActive: isActive !== false,
      },
    });

    res.status(201).json({ success: true, message: 'بازه بودجه ایجاد شد.', data: option });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/order-config/budget-options/:id
export const updateBudgetOption = async (req, res, next) => {
  try {
    const existing = await prisma.budgetOption.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res, 'بازه بودجه یافت نشد.');

    const { label, value, icon, sortOrder, isActive } = req.body;

    if (value !== undefined && value !== existing.value) {
      const dup = await prisma.budgetOption.findUnique({ where: { value } });
      if (dup) return badRequest(res, 'گزینه‌ای با این value از قبل وجود دارد.');
    }

    const updates = {};
    if (label     !== undefined) updates.label     = label;
    if (value     !== undefined) updates.value     = value;
    if (icon      !== undefined) updates.icon      = icon;
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
    if (isActive  !== undefined) updates.isActive  = !!isActive;

    if (Object.keys(updates).length === 0) {
      return badRequest(res, 'هیچ فیلدی برای بروزرسانی ارسال نشده.');
    }

    const option = await prisma.budgetOption.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json({ success: true, message: 'بازه بودجه بروزرسانی شد.', data: option });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/order-config/budget-options/:id
export const deleteBudgetOption = async (req, res, next) => {
  try {
    const existing = await prisma.budgetOption.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res, 'بازه بودجه یافت نشد.');

    // قوانین تخمین قیمت مرتبط نیز با کسکید حذف می‌شوند
    await prisma.budgetOption.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'بازه بودجه حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/order-config/budget-options/reorder
export const reorderBudgetOptions = reorderModel(prisma.budgetOption);

// ══════════════════════════════════════════════════════════════════════════
// TIMELINE OPTIONS — زمانبندی مورد نظر
// ══════════════════════════════════════════════════════════════════════════

// GET /api/admin/order-config/timeline-options
export const getTimelineOptions = async (req, res, next) => {
  try {
    const options = await prisma.timelineOption.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: options });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/order-config/timeline-options
export const createTimelineOption = async (req, res, next) => {
  try {
    const { label, value, sortOrder, isActive } = req.body;

    if (!label || !value) return badRequest(res, 'فیلدهای label و value الزامی هستند.');

    const existing = await prisma.timelineOption.findUnique({ where: { value } });
    if (existing) return badRequest(res, 'گزینه‌ای با این value از قبل وجود دارد.');

    const option = await prisma.timelineOption.create({
      data: {
        label,
        value,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        isActive: isActive !== false,
      },
    });

    res.status(201).json({ success: true, message: 'بازه زمانبندی ایجاد شد.', data: option });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/order-config/timeline-options/:id
export const updateTimelineOption = async (req, res, next) => {
  try {
    const existing = await prisma.timelineOption.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res, 'بازه زمانبندی یافت نشد.');

    const { label, value, sortOrder, isActive } = req.body;

    if (value !== undefined && value !== existing.value) {
      const dup = await prisma.timelineOption.findUnique({ where: { value } });
      if (dup) return badRequest(res, 'گزینه‌ای با این value از قبل وجود دارد.');
    }

    const updates = {};
    if (label     !== undefined) updates.label     = label;
    if (value     !== undefined) updates.value     = value;
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder);
    if (isActive  !== undefined) updates.isActive  = !!isActive;

    if (Object.keys(updates).length === 0) {
      return badRequest(res, 'هیچ فیلدی برای بروزرسانی ارسال نشده.');
    }

    const option = await prisma.timelineOption.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json({ success: true, message: 'بازه زمانبندی بروزرسانی شد.', data: option });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/order-config/timeline-options/:id
export const deleteTimelineOption = async (req, res, next) => {
  try {
    const existing = await prisma.timelineOption.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res, 'بازه زمانبندی یافت نشد.');

    await prisma.timelineOption.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'بازه زمانبندی حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/order-config/timeline-options/reorder
export const reorderTimelineOptions = reorderModel(prisma.timelineOption);

// ══════════════════════════════════════════════════════════════════════════
// PRICE ESTIMATE RULES — تخمین اولیه قیمت بر اساس بودجه/زمانبندی
// ══════════════════════════════════════════════════════════════════════════

const validatePriceEstimatePayload = async (body, res) => {
  const { budgetOptionId, timelineOptionId, minAmount, maxAmount } = body;

  if (!Number.isFinite(Number(minAmount)) || !Number.isFinite(Number(maxAmount))) {
    badRequest(res, 'فیلدهای minAmount و maxAmount الزامی و باید عددی باشند.');
    return null;
  }

  if (Number(minAmount) < 0 || Number(maxAmount) < 0) {
    badRequest(res, 'مقادیر نمی‌توانند منفی باشند.');
    return null;
  }

  if (Number(minAmount) > Number(maxAmount)) {
    badRequest(res, 'مقدار حداقل نمی‌تواند از مقدار حداکثر بیشتر باشد.');
    return null;
  }

  if (budgetOptionId) {
    const budget = await prisma.budgetOption.findUnique({ where: { id: budgetOptionId } });
    if (!budget) {
      badRequest(res, 'بازه بودجه انتخاب‌شده یافت نشد.');
      return null;
    }
  }

  if (timelineOptionId) {
    const timeline = await prisma.timelineOption.findUnique({ where: { id: timelineOptionId } });
    if (!timeline) {
      badRequest(res, 'بازه زمانبندی انتخاب‌شده یافت نشد.');
      return null;
    }
  }

  return true;
};

// GET /api/admin/order-config/price-estimates
export const getPriceEstimateRules = async (req, res, next) => {
  try {
    const rules = await prisma.priceEstimateRule.findMany({
      orderBy: [{ createdAt: 'asc' }],
      include: {
        budgetOption:   { select: { id: true, label: true, value: true } },
        timelineOption: { select: { id: true, label: true, value: true } },
      },
    });
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/order-config/price-estimates
export const createPriceEstimateRule = async (req, res, next) => {
  try {
    const { budgetOptionId, timelineOptionId, minAmount, maxAmount, unit, isActive } = req.body;

    const valid = await validatePriceEstimatePayload(req.body, res);
    if (!valid) return;

    const existing = await prisma.priceEstimateRule.findFirst({
      where: {
        budgetOptionId: budgetOptionId || null,
        timelineOptionId: timelineOptionId || null,
      },
    });
    if (existing) {
      return badRequest(res, 'برای این ترکیب بودجه/زمانبندی قانونی از قبل ثبت شده است.');
    }

    const rule = await prisma.priceEstimateRule.create({
      data: {
        budgetOptionId: budgetOptionId || null,
        timelineOptionId: timelineOptionId || null,
        minAmount: Number(minAmount),
        maxAmount: Number(maxAmount),
        unit: unit || 'میلیون تومان',
        isActive: isActive !== false,
      },
    });

    res.status(201).json({ success: true, message: 'قانون تخمین قیمت ایجاد شد.', data: rule });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/order-config/price-estimates/:id
export const updatePriceEstimateRule = async (req, res, next) => {
  try {
    const existing = await prisma.priceEstimateRule.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res, 'قانون تخمین قیمت یافت نشد.');

    const { budgetOptionId, timelineOptionId, minAmount, maxAmount, unit, isActive } = req.body;

    // فقط فیلدهایی که ست شده‌اند را اعتبارسنجی/اعمال کن
    const nextMin = minAmount !== undefined ? Number(minAmount) : existing.minAmount;
    const nextMax = maxAmount !== undefined ? Number(maxAmount) : existing.maxAmount;

    if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax)) {
      return badRequest(res, 'مقادیر minAmount/maxAmount باید عددی باشند.');
    }
    if (nextMin < 0 || nextMax < 0) {
      return badRequest(res, 'مقادیر نمی‌توانند منفی باشند.');
    }
    if (nextMin > nextMax) {
      return badRequest(res, 'مقدار حداقل نمی‌تواند از مقدار حداکثر بیشتر باشد.');
    }

    if (budgetOptionId !== undefined && budgetOptionId) {
      const budget = await prisma.budgetOption.findUnique({ where: { id: budgetOptionId } });
      if (!budget) return badRequest(res, 'بازه بودجه انتخاب‌شده یافت نشد.');
    }
    if (timelineOptionId !== undefined && timelineOptionId) {
      const timeline = await prisma.timelineOption.findUnique({ where: { id: timelineOptionId } });
      if (!timeline) return badRequest(res, 'بازه زمانبندی انتخاب‌شده یافت نشد.');
    }

    const nextBudgetId   = budgetOptionId   !== undefined ? (budgetOptionId   || null) : existing.budgetOptionId;
    const nextTimelineId = timelineOptionId !== undefined ? (timelineOptionId || null) : existing.timelineOptionId;

    if (nextBudgetId !== existing.budgetOptionId || nextTimelineId !== existing.timelineOptionId) {
      const dup = await prisma.priceEstimateRule.findFirst({
        where: {
          id: { not: existing.id },
          budgetOptionId: nextBudgetId,
          timelineOptionId: nextTimelineId,
        },
      });
      if (dup) return badRequest(res, 'برای این ترکیب بودجه/زمانبندی قانونی از قبل ثبت شده است.');
    }

    const rule = await prisma.priceEstimateRule.update({
      where: { id: req.params.id },
      data: {
        budgetOptionId: nextBudgetId,
        timelineOptionId: nextTimelineId,
        minAmount: nextMin,
        maxAmount: nextMax,
        unit: unit !== undefined ? unit : existing.unit,
        isActive: isActive !== undefined ? !!isActive : existing.isActive,
      },
    });

    res.json({ success: true, message: 'قانون تخمین قیمت بروزرسانی شد.', data: rule });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/order-config/price-estimates/:id
export const deletePriceEstimateRule = async (req, res, next) => {
  try {
    const existing = await prisma.priceEstimateRule.findUnique({ where: { id: req.params.id } });
    if (!existing) return notFound(res, 'قانون تخمین قیمت یافت نشد.');

    await prisma.priceEstimateRule.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'قانون تخمین قیمت حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════════════════════════════════
// PUBLIC — برای رندر فرم «ثبت سفارش» در فرانت (نیازی به لاگین ندارد)
// ══════════════════════════════════════════════════════════════════════════

// GET /api/order-config — تمام گزینه‌های فعال
export const getPublicOrderFormOptions = async (req, res, next) => {
  try {
    const [mainCategories, subcategories, budgetOptions, timelineOptions] = await Promise.all([
      prisma.projectMainCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, key: true, title: true, description: true, icon: true, sortOrder: true },
      }),
      prisma.projectSubcategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, label: true, mainCategoryId: true, sortOrder: true },
      }),
      prisma.budgetOption.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, label: true, value: true, icon: true, sortOrder: true },
      }),
      prisma.timelineOption.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, label: true, value: true, sortOrder: true },
      }),
    ]);

    res.json({
      success: true,
      data: { mainCategories, subcategories, budgetOptions, timelineOptions },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/order-config/estimate?budgetValue=...&timelineValue=...
// محاسبه تخمین اولیه قیمت بر اساس دقیق‌ترین قانون منطبق
export const getPublicPriceEstimate = async (req, res, next) => {
  try {
    const { budgetValue, timelineValue } = req.query;

    let budgetOptionId = null;
    let timelineOptionId = null;

    if (budgetValue) {
      const budget = await prisma.budgetOption.findUnique({ where: { value: String(budgetValue) } });
      if (budget) budgetOptionId = budget.id;
    }

    if (timelineValue) {
      const timeline = await prisma.timelineOption.findUnique({ where: { value: String(timelineValue) } });
      if (timeline) timelineOptionId = timeline.id;
    }

    // ترتیب اولویت: تطبیق دقیق هر دو > فقط بودجه > فقط زمانبندی > پیش‌فرض کلی
    const candidates = [];
    if (budgetOptionId && timelineOptionId) {
      candidates.push({ budgetOptionId, timelineOptionId });
    }
    if (budgetOptionId) {
      candidates.push({ budgetOptionId, timelineOptionId: null });
    }
    if (timelineOptionId) {
      candidates.push({ budgetOptionId: null, timelineOptionId });
    }
    candidates.push({ budgetOptionId: null, timelineOptionId: null });

    let rule = null;
    for (const where of candidates) {
      rule = await prisma.priceEstimateRule.findFirst({
        where: { ...where, isActive: true },
      });
      if (rule) break;
    }

    if (!rule) {
      return res.json({ success: true, data: null, message: 'هیچ تخمینی برای این ترکیب ثبت نشده است.' });
    }

    res.json({
      success: true,
      data: {
        minAmount: rule.minAmount,
        maxAmount: rule.maxAmount,
        unit: rule.unit,
        label: `${rule.minAmount} تا ${rule.maxAmount} ${rule.unit}`,
      },
    });
  } catch (error) {
    next(error);
  }
};