// src/controllers/payment.controller.js
import prisma from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const SANDBOX        = process.env.ZARINPAL_SANDBOX === 'true';
const MERCHANT_ID    = process.env.ZARINPAL_MERCHANT_ID;
const CLIENT_URL     = process.env.CLIENT_URL || 'http://localhost:5173';

const ZARINPAL_BASE  = SANDBOX
  ? 'https://sandbox.zarinpal.com'
  : 'https://payment.zarinpal.com';

const REQUEST_URL    = `${ZARINPAL_BASE}/pg/v4/payment/request.json`;
const VERIFY_URL     = `${ZARINPAL_BASE}/pg/v4/payment/verify.json`;
const STARTPAY_URL   = `${ZARINPAL_BASE}/pg/StartPay/`;
const CALLBACK_URL   = `${CLIENT_URL}/payment/callback`;

// ── helper: generate order number ────────────────────────────────────────────
async function generateOrderNumber() {
  const year  = new Date().getFullYear() - 621; // تقریب شمسی
  const count = await prisma.order.count();
  return `DT-${year}-${String(count + 1).padStart(4, '0')}`;
}

// ── helper: coupon validation (همان منطق order.controller) ───────────────────
async function validateCoupon(couponCode, totalAmount) {
  const coupon = await prisma.coupon.findFirst({
    where: {
      code:     couponCode.toUpperCase(),
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!coupon)
    throw { status: 400, message: 'کد تخفیف معتبر نیست یا منقضی شده.' };

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
    throw { status: 400, message: 'ظرفیت این کد تخفیف تکمیل شده است.' };

  if (coupon.minOrderAmount && totalAmount < coupon.minOrderAmount)
    throw {
      status: 400,
      message: `حداقل مبلغ سفارش برای این کد تخفیف ${coupon.minOrderAmount.toLocaleString('fa')} ریال است.`,
    };

  let discountAmount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discountAmount = Math.round(totalAmount * coupon.value / 100);
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  } else {
    discountAmount = Math.min(coupon.value, totalAmount);
  }

  return { coupon, discountAmount };
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/payment/request
// ── سفارش رو ثبت کن، authority بگیر، redirect URL برگردون ──────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export const requestPayment = async (req, res, next) => {
  try {
    const { couponCode, notes, customerInfo } = req.body;
    const userId = req.user.id;

    // ── ۱. سبد خرید ──────────────────────────────────────────────────────────
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0)
      return res.status(400).json({ success: false, message: 'سبد خرید شما خالی است.' });

    const inactiveItem = cart.items.find(i => !i.product.isActive);
    if (inactiveItem)
      return res.status(400).json({
        success: false,
        message: `محصول "${inactiveItem.product.name}" دیگر موجود نیست.`,
      });

    for (const item of cart.items) {
      if (item.product.stock !== -1 && item.product.stock < item.quantity)
        return res.status(400).json({
          success: false,
          message: `موجودی محصول "${item.product.name}" کافی نیست.`,
        });
    }

    // ── ۲. محاسبه مبلغ ───────────────────────────────────────────────────────
    let totalAmount = 0;
    const orderItems = cart.items.map(item => {
      const itemTotal = item.product.price * item.quantity;
      totalAmount += itemTotal;
      return {
        productId:  item.productId,
        quantity:   item.quantity,
        unitPrice:  item.product.price,
        totalPrice: itemTotal,
      };
    });

    // ── ۳. کد تخفیف (اختیاری) ────────────────────────────────────────────────
    let appliedCoupon    = null;
    let discountAmount   = 0;

    if (couponCode) {
      try {
        ({ coupon: appliedCoupon, discountAmount } = await validateCoupon(couponCode, totalAmount));
      } catch (err) {
        return res.status(err.status || 400).json({ success: false, message: err.message });
      }
    }

    const finalAmount = totalAmount - discountAmount;

    // ── ۴. ساخت سفارش با وضعیت UNPAID ───────────────────────────────────────
    const orderNumber = await generateOrderNumber();

    const order = await prisma.$transaction(async tx => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          totalAmount,
          discountAmount,
          finalAmount,
          couponCode: couponCode?.toUpperCase() || null,
          notes,
          paymentMethod: 'zarinpal',
          metadata: customerInfo ? { customerInfo } : undefined,
          items: { create: orderItems },
        },
      });

      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data:  { usageCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // ── ۵. درخواست به زرین‌پال ───────────────────────────────────────────────
    // زرین‌پال مبلغ رو به ریال می‌خواد — قیمت‌های ما به تومان هستن
    const amountInRials = finalAmount * 10;

    const zarinRes = await fetch(REQUEST_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id:  MERCHANT_ID,
        amount:       amountInRials,
        callback_url: CALLBACK_URL,
        description:  `پرداخت سفارش ${orderNumber}`,
        metadata: {
          order_id: order.id,
          email:    req.user.email,
        },
      }),
    });

    const zarinData = await zarinRes.json();

    if (zarinData?.data?.code !== 100) {
      // اگه زرین‌پال خطا داد، سفارش رو FAILED کن
      await prisma.order.update({
        where: { id: order.id },
        data:  { paymentStatus: 'FAILED' },
      });
      return res.status(502).json({
        success: false,
        message: 'خطا در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید.',
        zarinError: zarinData?.errors,
      });
    }

    const authority = zarinData.data.authority;

    // authority رو روی سفارش ذخیره کن
    await prisma.order.update({
      where: { id: order.id },
      data:  { paymentRef: authority },
    });

    return res.json({
      success:     true,
      redirectUrl: `${STARTPAY_URL}${authority}`,
      orderId:     order.id,
      orderNumber: order.orderNumber,
    });

  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/payment/verify
// ── بعد از برگشت کاربر، پرداخت رو تأیید کن ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export const verifyPayment = async (req, res, next) => {
  try {
    const { authority, status } = req.body;

    if (!authority)
      return res.status(400).json({ success: false, message: 'authority ارسال نشده.' });

    // ── ۱. پیدا کردن سفارش ───────────────────────────────────────────────────
    const order = await prisma.order.findFirst({
      where: { paymentRef: authority },
      include: { items: { include: { product: true } } },
    });

    if (!order)
      return res.status(404).json({ success: false, message: 'سفارش مرتبط با این تراکنش یافت نشد.' });

    if (order.paymentStatus === 'PAID')
      return res.json({
        success:     true,
        alreadyPaid: true,
        message:     'این تراکنش قبلاً تأیید شده است.',
        orderNumber: order.orderNumber,
      });

    // ── ۲. کاربر پرداخت رو لغو کرد ──────────────────────────────────────────
    if (status === 'NOK') {
      await prisma.order.update({
        where: { id: order.id },
        data:  { paymentStatus: 'FAILED' },
      });
      return res.status(402).json({
        success: false,
        message: 'پرداخت توسط کاربر لغو شد یا ناموفق بود.',
      });
    }

    // ── ۳. verify به زرین‌پال ─────────────────────────────────────────────────
    const amountInRials = order.finalAmount * 10;

    const verifyRes = await fetch(VERIFY_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        amount:      amountInRials,
        authority,
      }),
    });

    const verifyData = await verifyRes.json();
    const code = verifyData?.data?.code;

    // کد ۱۰۰ = موفق، کد ۱۰۱ = قبلاً verify شده
    if (code !== 100 && code !== 101) {
      await prisma.order.update({
        where: { id: order.id },
        data:  { paymentStatus: 'FAILED' },
      });
      return res.status(402).json({
        success: false,
        message: 'تأیید پرداخت ناموفق بود.',
        code,
      });
    }

    const refId   = verifyData.data.ref_id;
    const cardPan = verifyData.data.card_pan;

    // ── ۴. تأیید سفارش و ساخت لینک‌های دانلود ───────────────────────────────
    const downloads = order.items
      .filter(i => i.product.downloadUrl)
      .map(i => ({
        orderId:     order.id,
        productName: i.product.name,
        downloadUrl: i.product.downloadUrl,
        token:       uuidv4(),
        expiresAt:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // ۳۰ روز
      }));

    await prisma.$transaction(async tx => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status:        'COMPLETED',
          paymentRef:    String(refId),
          metadata:      { ...(order.metadata || {}), authority, refId, cardPan },
          paidAt:        new Date(),
        },
      });

      if (downloads.length > 0)
        await tx.orderDownload.createMany({ data: downloads });

      // سبد رو پاک کن — فقط بعد از پرداخت موفق
      const userCart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      for (const item of order.items) {
        const upd = { totalSales: { increment: item.quantity } };
        if (item.product.stock !== -1)
          upd.stock = { decrement: item.quantity };
        await tx.product.update({ where: { id: item.productId }, data: upd });
      }
    });

    return res.json({
      success:     true,
      message:     'پرداخت با موفقیت تأیید شد.',
      refId,
      cardPan,
      orderNumber: order.orderNumber,
      orderId:     order.id,
    });

  } catch (error) {
    next(error);
  }
};