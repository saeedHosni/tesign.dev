// src/controllers/coupon.controller.js
import prisma from '../config/db.js';

// POST /api/coupons/validate  — check coupon before checkout
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'کد تخفیف الزامی است.' });
    }

    if (!orderAmount || Number(orderAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'مبلغ سفارش نامعتبر است.' });
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'کد تخفیف معتبر نیست یا منقضی شده است.',
      });
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'ظرفیت این کد تخفیف تکمیل شده است.',
      });
    }

    if (coupon.minOrderAmount && Number(orderAmount) < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `حداقل مبلغ سفارش ${coupon.minOrderAmount.toLocaleString('fa')} ریال است.`,
      });
    }

    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = Math.round(Number(orderAmount) * coupon.value / 100);
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      discountAmount = Math.min(coupon.value, Number(orderAmount));
    }

    res.json({
      success: true,
      message: 'کد تخفیف اعمال شد.',
      data: {
        code:           coupon.code,
        type:           coupon.type,
        value:          coupon.value,
        discountAmount,
        finalAmount:    Number(orderAmount) - discountAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/coupons  [Admin]
export const getCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.count({ where }),
    ]);

    res.json({
      success: true,
      data: coupons,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/coupons  [Admin]
export const createCoupon = async (req, res, next) => {
  try {
    const { code, type, value, minOrderAmount, maxDiscount, usageLimit, expiresAt } = req.body;

    if (!code || !type || value === undefined) {
      return res.status(400).json({ success: false, message: 'کد، نوع و مقدار تخفیف الزامی است.' });
    }

    if (!['PERCENTAGE', 'FIXED'].includes(type)) {
      return res.status(400).json({ success: false, message: 'نوع تخفیف باید PERCENTAGE یا FIXED باشد.' });
    }

    const numValue = Number(value);
    if (type === 'PERCENTAGE' && (numValue <= 0 || numValue > 100)) {
      return res.status(400).json({ success: false, message: 'درصد تخفیف باید بین ۱ تا ۱۰۰ باشد.' });
    }

    if (type === 'FIXED' && numValue <= 0) {
      return res.status(400).json({ success: false, message: 'مبلغ تخفیف باید بزرگتر از صفر باشد.' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code:           code.toUpperCase(),
        type,
        value:          numValue,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxDiscount:    maxDiscount    ? Number(maxDiscount)    : null,
        usageLimit:     usageLimit     ? Number(usageLimit)     : null,
        expiresAt:      expiresAt      ? new Date(expiresAt)    : null,
      },
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/coupons/:id  [Admin]
export const updateCoupon = async (req, res, next) => {
  try {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'کد تخفیف یافت نشد.' });
    }

    const { type, value, minOrderAmount, maxDiscount, usageLimit, isActive, expiresAt } = req.body;

    const updates = {};
    if (type           !== undefined) updates.type           = type;
    if (value          !== undefined) updates.value          = Number(value);
    if (minOrderAmount !== undefined) updates.minOrderAmount = minOrderAmount ? Number(minOrderAmount) : null;
    if (maxDiscount    !== undefined) updates.maxDiscount    = maxDiscount    ? Number(maxDiscount)    : null;
    if (usageLimit     !== undefined) updates.usageLimit     = usageLimit     ? Number(usageLimit)     : null;
    if (isActive       !== undefined) updates.isActive       = Boolean(isActive);
    if (expiresAt      !== undefined) updates.expiresAt      = expiresAt ? new Date(expiresAt) : null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ فیلدی برای بروزرسانی ارسال نشده.' });
    }

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/coupons/:id  [Admin]  — soft delete
export const deleteCoupon = async (req, res, next) => {
  try {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'کد تخفیف یافت نشد.' });
    }

    await prisma.coupon.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'کد تخفیف غیرفعال شد.' });
  } catch (error) {
    next(error);
  }
};
