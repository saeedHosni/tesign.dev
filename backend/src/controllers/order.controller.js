// src/controllers/order.controller.js
import prisma from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Generate order number: DT-1404-XXXX
const generateOrderNumber = async () => {
  const year = new Date().getFullYear() - 621; // Shamsi approximate
  const count = await prisma.order.count();
  return `DT-${year}-${String(count + 1).padStart(4, '0')}`;
};

// POST /api/orders  — create order from cart
export const createOrder = async (req, res, next) => {
  try {
    const { couponCode, notes } = req.body;
    const userId = req.user.id;

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'سبد خرید شما خالی است.',
      });
    }

    // Validate all products are active
    const inactiveItem = cart.items.find(item => !item.product.isActive);
    if (inactiveItem) {
      return res.status(400).json({
        success: false,
        message: `محصول "${inactiveItem.product.name}" دیگر موجود نیست.`,
      });
    }

    // BUG FIX: Check stock for all items before creating order
    for (const item of cart.items) {
      if (item.product.stock !== -1 && item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `موجودی محصول "${item.product.name}" کافی نیست. موجودی فعلی: ${item.product.stock}`,
        });
      }
    }

    // Calculate totals
    let totalAmount = 0;
    let discountAmount = 0;

    const orderItems = cart.items.map((item) => {
      const itemTotal = item.product.price * item.quantity;
      totalAmount += itemTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: itemTotal,
      };
    });

    // BUG FIX: Cleaned up coupon validation (removed duplicate double-query logic)
    let appliedCoupon = null;
    if (couponCode) {
      const couponRaw = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (!couponRaw) {
        return res.status(400).json({
          success: false,
          message: 'کد تخفیف معتبر نیست یا منقضی شده.',
        });
      }

      if (couponRaw.usageLimit !== null && couponRaw.usageCount >= couponRaw.usageLimit) {
        return res.status(400).json({
          success: false,
          message: 'ظرفیت این کد تخفیف تکمیل شده است.',
        });
      }

      if (couponRaw.minOrderAmount && totalAmount < couponRaw.minOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `حداقل مبلغ سفارش برای این کد تخفیف ${couponRaw.minOrderAmount.toLocaleString('fa')} ریال است.`,
        });
      }

      if (couponRaw.type === 'PERCENTAGE') {
        discountAmount = Math.round(totalAmount * couponRaw.value / 100);
        if (couponRaw.maxDiscount) {
          discountAmount = Math.min(discountAmount, couponRaw.maxDiscount);
        }
      } else {
        discountAmount = Math.min(couponRaw.value, totalAmount);
      }

      appliedCoupon = couponRaw;
    }

    const finalAmount = totalAmount - discountAmount;
    const orderNumber = await generateOrderNumber();

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          totalAmount,
          discountAmount,
          finalAmount,
          couponCode: couponCode?.toUpperCase() || null,
          notes,
          items: { create: orderItems },
        },
        include: {
          items: {
            include: { product: { select: { id: true, name: true, slug: true } } },
          },
        },
      });

      // Update coupon usage
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      message: 'سفارش با موفقیت ایجاد شد.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/my  — user's own orders
export const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user.id },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true, icon: true } },
            },
          },
        },
      }),
      prisma.order.count({ where: { userId: req.user.id } }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
export const getOrder = async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role === 'CUSTOMER') where.userId = req.user.id;

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: {
          include: { product: true },
        },
        downloads: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'سفارش یافت نشد.' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// POST /api/orders/:id/confirm  [Admin]
export const confirmPayment = async (req, res, next) => {
  try {
    const { paymentRef, paymentMethod } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'سفارش یافت نشد.' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, message: 'این سفارش قبلاً پرداخت شده.' });
    }

    // Create download tokens for digital products
    const downloads = order.items
      .filter(i => i.product.downloadUrl)
      .map(i => ({
        orderId: order.id,
        productName: i.product.name,
        downloadUrl: i.product.downloadUrl,
        token: uuidv4(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }));

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'COMPLETED',
          paymentRef,
          paymentMethod,
          paidAt: new Date(),
        },
      });

      if (downloads.length > 0) {
        await tx.orderDownload.createMany({ data: downloads });
      }

      // Update product sales count — only for products with finite stock
      for (const item of order.items) {
        const productUpdate = { totalSales: { increment: item.quantity } };

        // Only decrement stock if it's finite (not -1 = unlimited digital)
        if (item.product.stock !== -1) {
          productUpdate.stock = { decrement: item.quantity };
        }

        await tx.product.update({
          where: { id: item.productId },
          data: productUpdate,
        });
      }
    });

    res.json({ success: true, message: 'پرداخت تأیید شد.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/admin/all  [Admin] — kept for backward compatibility
export const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (status)        where.status        = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name:  { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { select: { id: true, quantity: true, unitPrice: true, totalPrice: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/download/:token  — download file via token
export const downloadByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const download = await prisma.orderDownload.findUnique({
      where: { token },
      include: { order: { select: { userId: true, paymentStatus: true } } },
    });

    if (!download) {
      return res.status(404).json({ success: false, message: 'لینک دانلود یافت نشد.' });
    }

    // Check expiry
    if (download.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'لینک دانلود منقضی شده است.' });
    }

    // Check download limit
    if (download.downloadCount >= download.maxDownloads) {
      return res.status(403).json({ success: false, message: 'تعداد دفعات مجاز دانلود تمام شده است.' });
    }

    // Check ownership — logged-in user must own the order
    if (req.user && req.user.id !== download.order.userId) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز.' });
    }

    // Increment download count
    await prisma.orderDownload.update({
      where: { token },
      data: { downloadCount: { increment: 1 } },
    });

    // Redirect to actual download URL
    res.redirect(download.downloadUrl);
  } catch (error) {
    next(error);
  }
};
