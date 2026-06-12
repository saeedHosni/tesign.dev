// src/controllers/settings.controller.js
import prisma from '../config/db.js';

// GET /api/settings/public  — all public site data in one request
export const getPublicSettings = async (req, res, next) => {
  try {
    const [stats, ticker, services, featuredProducts] = await Promise.all([
      prisma.siteStat.findMany(),
      prisma.tickerItem.findMany({
        where:   { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.service.findMany({
        where:   { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { features: { orderBy: { sortOrder: 'asc' } } },
      }),
      prisma.product.findMany({
        where:   { isActive: true, isFeatured: true },
        orderBy: { sortOrder: 'asc' },
        take: 8,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images:   { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      }),
    ]);

    res.json({ success: true, data: { stats, ticker, services, featuredProducts } });
  } catch (error) {
    next(error);
  }
};

// GET /api/settings  [Admin]
export const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.siteSetting.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings  [Admin]
export const updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({ success: false, message: 'آرایه‌ای از تنظیمات الزامی است.' });
    }

    const results = await Promise.all(
      settings.map(({ key, value, group }) => {
        if (!key) return null;
        return prisma.siteSetting.upsert({
          where:  { key },
          update: { value, group: group || 'general' },
          create: { key, value, group: group || 'general' },
        });
      }).filter(Boolean)
    );

    res.json({ success: true, message: 'تنظیمات ذخیره شد.', data: results });
  } catch (error) {
    next(error);
  }
};

// GET /api/settings/dashboard  [Admin] — dashboard summary
export const getDashboardStats = async (req, res, next) => {
  try {
    const now       = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      newUsersThisMonth,
      totalOrders,
      ordersThisMonth,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      totalProducts,
      recentOrders,
      newLeads,
      pendingReviews,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } } }),
      prisma.order.count({ where: { paymentStatus: 'PAID' } }),
      prisma.order.count({ where: { paymentStatus: 'PAID', paidAt: { gte: startOfMonth } } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { finalAmount: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID', paidAt: { gte: startOfMonth } },
        _sum: { finalAmount: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID', paidAt: { gte: startOfLastMonth, lt: startOfMonth } },
        _sum: { finalAmount: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.findMany({
        where:   { paymentStatus: 'PAID' },
        take:    5,
        orderBy: { createdAt: 'desc' },
        include: {
          user:  { select: { name: true, email: true } },
          items: { select: { quantity: true, totalPrice: true } },
        },
      }),
      prisma.projectLead.count({ where: { status: 'NEW' } }),
      prisma.review.count({ where: { isApproved: false } }),
    ]);

    const thisMonthRev  = revenueThisMonth._sum.finalAmount  || 0;
    const lastMonthRev  = revenueLastMonth._sum.finalAmount  || 0;
    const revenueGrowth = lastMonthRev > 0
      ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100)
      : null;

    res.json({
      success: true,
      data: {
        totalUsers,
        newUsersThisMonth,
        totalOrders,
        ordersThisMonth,
        totalRevenue:      totalRevenue._sum.finalAmount || 0,
        revenueThisMonth:  thisMonthRev,
        revenueLastMonth:  lastMonthRev,
        revenueGrowth,     // percentage change vs last month (null if no last month data)
        totalProducts,
        recentOrders,
        newLeads,
        pendingReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings/ticker  [Admin]
export const updateTicker = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'آرایه‌ای از آیتم‌های تیکر الزامی است.' });
    }

    // Use a transaction to delete old and create new atomically
    const created = await prisma.$transaction(async (tx) => {
      await tx.tickerItem.deleteMany({});
      return tx.tickerItem.createMany({
        data: items.map((item, i) => ({
          text:      item.text,
          isActive:  item.isActive !== false,
          sortOrder: item.sortOrder ?? i,
        })),
      });
    });

    res.json({ success: true, message: 'تیکر بروز شد.', data: created });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings/stats  [Admin]
export const updateSiteStats = async (req, res, next) => {
  try {
    const { stats } = req.body;

    if (!Array.isArray(stats) || stats.length === 0) {
      return res.status(400).json({ success: false, message: 'آرایه‌ای از آمارها الزامی است.' });
    }

    const results = await Promise.all(
      stats.map(stat => {
        if (!stat.key) return null;
        return prisma.siteStat.upsert({
          where:  { key: stat.key },
          update: stat,
          create: stat,
        });
      }).filter(Boolean)
    );

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};
