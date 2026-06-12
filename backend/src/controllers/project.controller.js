// src/controllers/project.controller.js
import prisma from '../config/db.js';

// Simple email format check
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// POST /api/projects  — public form submission
export const submitProjectLead = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      serviceId,
      projectType,
      budget,
      description,
      source = 'banner',
    } = req.body;

    // Validate email or phone present
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'ایمیل یا شماره تماس الزامی است.',
      });
    }

    // BUG FIX: validate email format when provided
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'فرمت ایمیل صحیح نیست.' });
    }

    // BUG FIX: validate serviceId actually exists when provided
    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service) {
        return res.status(400).json({ success: false, message: 'سرویس انتخاب‌شده یافت نشد.' });
      }
    }

    const lead = await prisma.projectLead.create({
      data: {
        name,
        email,
        phone,
        serviceId: serviceId || null,
        projectType,
        budget,
        description,
        source,
        userId: req.user?.id || null,
      },
    });

    // TODO: send notification email to admin
    // await sendLeadNotificationEmail(lead);

    res.status(201).json({
      success: true,
      message: 'درخواست شما با موفقیت ثبت شد. تیم ما ظرف ۲۴ ساعت با شما تماس می‌گیرد.',
      data: { id: lead.id },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects  [Admin]
export const getProjectLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name:  { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.projectLead.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { id: true, title: true } },
          user:    { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.projectLead.count({ where }),
    ]);

    res.json({
      success: true,
      data: leads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/projects/:id  [Admin] — update status/notes
export const updateProjectLead = async (req, res, next) => {
  try {
    const { status, notes, assignedTo } = req.body;

    // BUG FIX: check lead exists before updating (was throwing P2025 unhandled)
    const existing = await prisma.projectLead.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'درخواست یافت نشد.' });
    }

    // BUG FIX: validate status value
    const validStatuses = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'وضعیت نامعتبر است.' });
    }

    const updates = {};
    if (status     !== undefined) updates.status     = status;
    if (notes      !== undefined) updates.notes      = notes;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ فیلدی برای بروزرسانی ارسال نشده.' });
    }

    const lead = await prisma.projectLead.update({
      where: { id: req.params.id },
      data:  updates,
    });

    res.json({ success: true, message: 'درخواست بروز شد.', data: lead });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/stats  [Admin]
export const getLeadStats = async (req, res, next) => {
  try {
    const [total, byStatus] = await Promise.all([
      prisma.projectLead.count(),
      prisma.projectLead.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const stats = {
      total,
      byStatus: byStatus.reduce((acc, s) => {
        acc[s.status] = s._count._all;
        return acc;
      }, {}),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
