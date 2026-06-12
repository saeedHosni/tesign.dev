// src/controllers/admin.controller.js
import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

// ─── USERS ────────────────────────────────────────────────────────────────────

// GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name:  { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, phone: true,
          role: true, isActive: true, isVerified: true, createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id
export const updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive, isVerified } = req.body;

    // Prevent admin from deactivating or demoting themselves
    if (req.params.id === req.user.id) {
      if (isActive === false || isActive === 'false') {
        return res.status(400).json({ success: false, message: 'نمی‌توانید حساب خودتان را غیرفعال کنید.' });
      }
      if (role && role !== req.user.role) {
        return res.status(400).json({ success: false, message: 'نمی‌توانید نقش خودتان را تغییر دهید.' });
      }
    }

    const updates = {};
    if (name       !== undefined) updates.name       = name;
    if (role       !== undefined) updates.role       = role;
    if (isActive   !== undefined) updates.isActive   = Boolean(isActive);
    if (isVerified !== undefined) updates.isVerified = Boolean(isVerified);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ فیلدی برای بروزرسانی ارسال نشده.' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updates,
      select: { id: true, name: true, email: true, role: true, isActive: true, isVerified: true },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id  [SuperAdmin only]
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'نمی‌توانید حساب خودتان را حذف کنید.' });
    }

    // Soft delete — just deactivate
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'کاربر غیرفعال شد.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/users  — create admin/manager user
export const createAdminUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'نام، ایمیل و رمز عبور الزامی است.' });
    }

    if (!['ADMIN', 'MANAGER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'نقش نامعتبر است. فقط ADMIN یا MANAGER مجاز است.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'این ایمیل قبلاً ثبت شده است.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, isVerified: true },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

// GET /api/admin/analytics
export const getAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = Number(period);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: { paymentStatus: 'PAID', paidAt: { gte: since } },
      select: { finalAmount: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    // Group by date
    const byDate = orders.reduce((acc, order) => {
      const date = order.paidAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, revenue: 0, count: 0 };
      acc[date].revenue += order.finalAmount;
      acc[date].count++;
      return acc;
    }, {});

    // Top selling products in the period
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { paymentStatus: 'PAID', paidAt: { gte: since } },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5,
    });

    const topProductIds = topProducts.map(p => p.productId);
    const productDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, slug: true },
    });
    const productMap = Object.fromEntries(productDetails.map(p => [p.id, p]));

    const topProductsWithDetails = topProducts.map(p => ({
      product: productMap[p.productId] || null,
      totalQuantity: p._sum.quantity,
      totalRevenue: p._sum.totalPrice,
    }));

    res.json({
      success: true,
      data: {
        chart: Object.values(byDate),
        totalRevenue: orders.reduce((sum, o) => sum + o.finalAmount, 0),
        totalOrders: orders.length,
        topProducts: topProductsWithDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── ORDERS (Admin) ───────────────────────────────────────────────────────────

// GET /api/admin/orders
export const getOrders = async (req, res, next) => {
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
          items: {
            select: { id: true, quantity: true, unitPrice: true, totalPrice: true },
          },
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

// PATCH /api/admin/orders/:id
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus, notes } = req.body;

    const allowedStatuses        = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
    const allowedPaymentStatuses = ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'وضعیت سفارش نامعتبر است.' });
    }
    if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'وضعیت پرداخت نامعتبر است.' });
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'سفارش یافت نشد.' });
    }

    const updates = {};
    if (status        !== undefined) updates.status        = status;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
    if (notes         !== undefined) updates.notes         = notes;

    // If admin manually marks payment as PAID, record paidAt timestamp
    if (paymentStatus === 'PAID' && !order.paidAt) {
      updates.paidAt = new Date();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ فیلدی برای بروزرسانی ارسال نشده.' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ success: true, message: 'سفارش بروز شد.', data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── REVIEWS (Admin) ──────────────────────────────────────────────────────────

// GET /api/admin/reviews
export const getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, approved } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (approved !== undefined) where.isApproved = approved === 'true';

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user:    { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/reviews/:id
export const deleteReview = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) {
      return res.status(404).json({ success: false, message: 'نظر یافت نشد.' });
    }

    await prisma.review.delete({ where: { id: req.params.id } });

    // Recalculate product rating after deletion
    const stats = await prisma.review.aggregate({
      where: { productId: review.productId, isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await prisma.product.update({
      where: { id: review.productId },
      data: { rating: stats._avg.rating || 0, reviewCount: stats._count._all },
    });

    res.json({ success: true, message: 'نظر حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// ─── COUPONS (Admin) ──────────────────────────────────────────────────────────

// PATCH /api/admin/coupons/:id
export const updateCoupon = async (req, res, next) => {
  try {
    const { type, value, minOrderAmount, maxDiscount, usageLimit, isActive, expiresAt } = req.body;

    const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'کد تخفیف یافت نشد.' });
    }

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

    const updated = await prisma.coupon.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── CATEGORIES (Admin) ───────────────────────────────────────────────────────

// GET /api/admin/categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        children: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/categories
export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, parentId } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'نام و اسلاگ الزامی است.' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/categories/:id
export const updateCategory = async (req, res, next) => {
  try {
    const { name, slug, description, parentId } = req.body;

    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'دسته‌بندی یافت نشد.' });
    }

    const updates = {};
    if (name        !== undefined) updates.name        = name;
    if (slug        !== undefined) updates.slug        = slug;
    if (description !== undefined) updates.description = description;
    if (parentId    !== undefined) updates.parentId    = parentId || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ فیلدی برای بروزرسانی ارسال نشده.' });
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/categories/:id
export const deleteCategory = async (req, res, next) => {
  try {
    const existing = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'دسته‌بندی یافت نشد.' });
    }

    if (existing._count.products > 0) {
      return res.status(400).json({
        success: false,
        message: `این دسته‌بندی دارای ${existing._count.products} محصول است. ابتدا محصولات را منتقل کنید.`,
      });
    }

    if (existing._count.children > 0) {
      return res.status(400).json({
        success: false,
        message: 'این دسته‌بندی دارای زیر دسته است. ابتدا زیر دسته‌ها را حذف کنید.',
      });
    }

    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'دسته‌بندی حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// ─── PRODUCT IMAGES (Admin) ───────────────────────────────────────────────────

// POST /api/admin/products/:id/images
export const addProductImage = async (req, res, next) => {
  try {
    const { url, alt, sortOrder } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: 'آدرس تصویر الزامی است.' });
    }

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    }

    const image = await prisma.productImage.create({
      data: {
        productId: req.params.id,
        url,
        alt: alt || null,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    res.status(201).json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/products/:id/images/:imageId
export const deleteProductImage = async (req, res, next) => {
  try {
    const image = await prisma.productImage.findFirst({
      where: { id: req.params.imageId, productId: req.params.id },
    });

    if (!image) {
      return res.status(404).json({ success: false, message: 'تصویر یافت نشد.' });
    }

    await prisma.productImage.delete({ where: { id: req.params.imageId } });
    res.json({ success: true, message: 'تصویر حذف شد.' });
  } catch (error) {
    next(error);
  }
};