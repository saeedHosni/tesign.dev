// src/controllers/admin.controller.js
import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

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
    const updates = {};

    if (name      !== undefined) updates.name      = name;
    if (role      !== undefined) updates.role      = role;
    if (isActive  !== undefined) updates.isActive  = Boolean(isActive);
    if (isVerified !== undefined) updates.isVerified = Boolean(isVerified);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updates,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/users  — create admin/manager user
export const createAdminUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!['ADMIN', 'MANAGER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'نقش نامعتبر.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, isVerified: true },
      select: { id: true, name: true, email: true, role: true },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics  — revenue chart data
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

    res.json({
      success: true,
      data: {
        chart: Object.values(byDate),
        totalRevenue: orders.reduce((sum, o) => sum + o.finalAmount, 0),
        totalOrders: orders.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
