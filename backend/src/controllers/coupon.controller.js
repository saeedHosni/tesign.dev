// src/controllers/coupon.controller.js
import prisma from '../config/db.js';

// POST /api/coupons/validate  — check coupon before checkout
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

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

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'ظرفیت این کد تخفیف تکمیل شده است.',
      });
    }

    if (coupon.minOrderAmount && Number(orderAmount) < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `حداقل مبلغ سفارش ${coupon.minOrderAmount.toLocaleString('fa')} تومان است.`,
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
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        finalAmount: Number(orderAmount) - discountAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/coupons  [Admin]
export const createCoupon = async (req, res, next) => {
  try {
    const { code, type, value, minOrderAmount, maxDiscount, usageLimit, expiresAt } = req.body;

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: Number(value),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

// GET /api/coupons  [Admin]
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/coupons/:id  [Admin]
export const deleteCoupon = async (req, res, next) => {
  try {
    await prisma.coupon.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'کد تخفیف غیرفعال شد.' });
  } catch (error) {
    next(error);
  }
};
