// src/controllers/settings.controller.js
import prisma from '../config/db.js';

// GET /api/settings/public  — all public site data in one request
export const getPublicSettings = async (req, res, next) => {
  try {
    const [stats, ticker, services, featuredProducts] = await Promise.all([
      prisma.siteStat.findMany(),
      prisma.tickerItem.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { features: { orderBy: { sortOrder: 'asc' } } },
      }),
      prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: { sortOrder: 'asc' },
        take: 8,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: { stats, ticker, services, featuredProducts },
    });
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
    const { settings } = req.body; // [{ key, value, group }]

    const results = await Promise.all(
      settings.map(({ key, value, group }) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value, group },
          create: { key, value, group },
        })
      )
    );

    res.json({ success: true, message: 'تنظیمات ذخیره شد.', data: results });
  } catch (error) {
    next(error);
  }
};

// GET /api/settings/stats  [Admin] — dashboard summary
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalOrders,
      totalRevenue,
      totalProducts,
      recentOrders,
      newLeads,
      pendingReviews,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count({ where: { paymentStatus: 'PAID' } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { finalAmount: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.findMany({
        where: { paymentStatus: 'PAID' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { quantity: true } },
        },
      }),
      prisma.projectLead.count({ where: { status: 'NEW' } }),
      prisma.review.count({ where: { isApproved: false } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue._sum.finalAmount || 0,
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
    const { items } = req.body; // [{ text, isActive, sortOrder }]

    await prisma.tickerItem.deleteMany({});
    const created = await prisma.tickerItem.createMany({
      data: items.map((item, i) => ({
        text: item.text,
        isActive: item.isActive !== false,
        sortOrder: item.sortOrder ?? i,
      })),
    });

    res.json({ success: true, message: 'تیکر بروز شد.', data: created });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings/stats  [Admin]
export const updateSiteStats = async (req, res, next) => {
  try {
    const { stats } = req.body; // [{ key, label, value, isStatic, suffix }]

    const results = await Promise.all(
      stats.map(stat =>
        prisma.siteStat.upsert({
          where: { key: stat.key },
          update: stat,
          create: stat,
        })
      )
    );

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};
