// src/controllers/ticket.controller.js
// سیستم تیکت پشتیبانی — بخش کاربری

import prisma from '../config/db.js';

// ─── ابزارهای کمکی ────────────────────────────────────────────────────────────

// تولید شماره تیکت یکتا: TK-YYYYMM-XXXX
async function generateTicketNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `TK-${year}${month}-`;

  const last = await prisma.ticket.findFirst({
    where: { ticketNumber: { startsWith: prefix } },
    orderBy: { ticketNumber: 'desc' },
    select: { ticketNumber: true },
  });

  let seq = 1;
  if (last) {
    const parts = last.ticketNumber.split('-');
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// فیلد select مشترک برای لیست تیکت‌ها
const ticketListSelect = {
  id: true,
  ticketNumber: true,
  department: true,
  priority: true,
  status: true,
  subject: true,
  createdAt: true,
  updatedAt: true,
  order: { select: { id: true, orderNumber: true } },
  messages: {
    take: 1,
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, senderRole: true },
  },
};

// ─── کاربر: ثبت تیکت جدید ────────────────────────────────────────────────────

// POST /api/dashboard/tickets
export const createTicket = async (req, res, next) => {
  try {
    const {
      subject,
      body,
      department = 'SUPPORT',
      priority = 'MEDIUM',
      orderId,
      attachments = [],
    } = req.body;

    // اگر orderId آمده، مطمئن شویم به این کاربر تعلق دارد
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId: req.user.id },
      });
      if (!order) {
        return res.status(400).json({
          success: false,
          message: 'سفارش مورد نظر یافت نشد.',
        });
      }
    }

    // اعتبارسنجی پیوست‌ها
    const cleanAttachments = [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      if (attachments.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'حداکثر ۵ فایل پیوست مجاز است.',
        });
      }
      for (const a of attachments) {
        if (!a?.url || typeof a.url !== 'string') continue;
        cleanAttachments.push({
          filename: a.filename || 'file',
          originalName: a.originalName || null,
          url: a.url,
          mimetype: a.mimetype || null,
          size: Number.isFinite(Number(a.size)) ? Number(a.size) : null,
        });
      }
    }

    const ticketNumber = await generateTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        userId: req.user.id,
        orderId: orderId || null,
        department,
        priority,
        subject: subject.trim(),
        messages: {
          create: {
            senderId: req.user.id,
            senderRole: req.user.role,
            body: body.trim(),
            attachments:
              cleanAttachments.length > 0
                ? { create: cleanAttachments }
                : undefined,
          },
        },
      },
      select: {
        id: true,
        ticketNumber: true,
        department: true,
        priority: true,
        status: true,
        subject: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'تیکت شما با موفقیت ثبت شد.',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// ─── کاربر: لیست تیکت‌های خودش ──────────────────────────────────────────────

// GET /api/dashboard/tickets?page=1&limit=10&status=OPEN&department=SUPPORT
export const getMyTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, department } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { userId: req.user.id };
    if (status)     where.status     = status;
    if (department) where.department = department;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { updatedAt: 'desc' },
        select: ticketListSelect,
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      success: true,
      data: tickets,
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

// ─── کاربر: جزئیات کامل یک تیکت + تمام پیام‌ها ──────────────────────────────

// GET /api/dashboard/tickets/:id
export const getMyTicket = async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        order: { select: { id: true, orderNumber: true } },
        messages: {
          where: { isInternal: false },  // کاربر یادداشت‌های داخلی نمی‌بیند
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
            attachments: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'تیکت یافت نشد.',
      });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

// ─── کاربر: ارسال پیام جدید در تیکت ─────────────────────────────────────────

// POST /api/dashboard/tickets/:id/messages
export const addMyTicketMessage = async (req, res, next) => {
  try {
    const { body, attachments = [] } = req.body;

    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد.' });
    }

    if (ticket.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: 'این تیکت بسته شده است و امکان ارسال پیام جدید وجود ندارد.',
      });
    }

    // اعتبارسنجی پیوست‌ها
    const cleanAttachments = [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      if (attachments.length > 5) {
        return res.status(400).json({ success: false, message: 'حداکثر ۵ فایل پیوست مجاز است.' });
      }
      for (const a of attachments) {
        if (!a?.url) continue;
        cleanAttachments.push({
          filename: a.filename || 'file',
          originalName: a.originalName || null,
          url: a.url,
          mimetype: a.mimetype || null,
          size: Number.isFinite(Number(a.size)) ? Number(a.size) : null,
        });
      }
    }

    // ثبت پیام و تغییر وضعیت به PENDING (انتظار پاسخ ادمین)
    const [message] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: req.user.id,
          senderRole: req.user.role,
          body: body.trim(),
          attachments:
            cleanAttachments.length > 0
              ? { create: cleanAttachments }
              : undefined,
        },
        include: {
          sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
          attachments: true,
        },
      }),
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: 'OPEN' },  // کاربر پیام داد → دوباره منتظر پاسخ ادمین
      }),
    ]);

    res.status(201).json({
      success: true,
      message: 'پیام شما ارسال شد.',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

// ─── کاربر: بستن تیکت ────────────────────────────────────────────────────────

// PATCH /api/dashboard/tickets/:id/close
export const closeMyTicket = async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد.' });
    }

    if (ticket.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'تیکت قبلاً بسته شده است.' });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'CLOSED', closedAt: new Date() },
      select: { id: true, status: true, closedAt: true },
    });

    res.json({ success: true, message: 'تیکت با موفقیت بسته شد.', data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── ادمین: لیست همه تیکت‌ها ─────────────────────────────────────────────────

// GET /api/admin/tickets
export const adminGetTickets = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      department,
      priority,
      search,
      assignedTo,
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status)     where.status     = status;
    if (department) where.department = department;
    if (priority)   where.priority   = priority;
    if (assignedTo === 'me')         where.assignedTo = req.user.id;
    else if (assignedTo === 'none')  where.assignedTo = null;
    else if (assignedTo)             where.assignedTo = assignedTo;

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { subject:      { contains: search, mode: 'insensitive' } },
        { user: { name:  { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { updatedAt: 'desc' },
        select: {
          ...ticketListSelect,
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          assignedTo: true,
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      success: true,
      data: tickets,
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

// ─── ادمین: جزئیات کامل تیکت + تمام پیام‌ها (شامل internal) ─────────────────

// GET /api/admin/tickets/:id
export const adminGetTicket = async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true } },
        order: { select: { id: true, orderNumber: true, status: true, finalAmount: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
            attachments: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد.' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

// ─── ادمین: پاسخ به تیکت ─────────────────────────────────────────────────────

// POST /api/admin/tickets/:id/messages
export const adminReplyTicket = async (req, res, next) => {
  try {
    const { body, isInternal = false, attachments = [] } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد.' });
    }

    if (ticket.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: 'این تیکت بسته شده است.',
      });
    }

    // اعتبارسنجی پیوست‌ها
    const cleanAttachments = [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      if (attachments.length > 5) {
        return res.status(400).json({ success: false, message: 'حداکثر ۵ فایل پیوست مجاز است.' });
      }
      for (const a of attachments) {
        if (!a?.url) continue;
        cleanAttachments.push({
          filename: a.filename || 'file',
          originalName: a.originalName || null,
          url: a.url,
          mimetype: a.mimetype || null,
          size: Number.isFinite(Number(a.size)) ? Number(a.size) : null,
        });
      }
    }

    // اگر پاسخ عمومی (نه internal) باشد، وضعیت به ANSWERED تغییر می‌کند
    // اگر internal باشد، وضعیت تیکت تغییر نمی‌کند
    const newStatus = isInternal ? ticket.status : 'ANSWERED';

    const [message] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: req.user.id,
          senderRole: req.user.role,
          body: body.trim(),
          isInternal: Boolean(isInternal),
          attachments:
            cleanAttachments.length > 0
              ? { create: cleanAttachments }
              : undefined,
        },
        include: {
          sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
          attachments: true,
        },
      }),
      prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: newStatus,
          assignedTo: ticket.assignedTo || req.user.id, // اگر هنوز assign نشده، به این ادمین assign شود
        },
      }),
    ]);

    res.status(201).json({
      success: true,
      message: isInternal ? 'یادداشت داخلی ثبت شد.' : 'پاسخ ارسال شد.',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

// ─── ادمین: تغییر وضعیت / اولویت / assign تیکت ──────────────────────────────

// PATCH /api/admin/tickets/:id
export const adminUpdateTicket = async (req, res, next) => {
  try {
    const { status, priority, assignedTo } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'تیکت یافت نشد.' });
    }

    const data = {};
    if (status     !== undefined) data.status     = status;
    if (priority   !== undefined) data.priority   = priority;
    if (assignedTo !== undefined) data.assignedTo = assignedTo || null;

    // اگر وضعیت به CLOSED تغییر کرد، تاریخ بسته شدن ثبت شود
    if (status === 'CLOSED' && ticket.status !== 'CLOSED') {
      data.closedAt = new Date();
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ فیلدی برای بروزرسانی ارسال نشده.' });
    }

    const updated = await prisma.ticket.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        priority: true,
        assignedTo: true,
        closedAt: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── ادمین: آمار تیکت‌ها ─────────────────────────────────────────────────────

// GET /api/admin/tickets/stats
export const adminGetTicketStats = async (req, res, next) => {
  try {
    const [byStatus, byDepartment, byPriority] = await Promise.all([
      prisma.ticket.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.ticket.groupBy({
        by: ['department'],
        _count: { _all: true },
      }),
      prisma.ticket.groupBy({
        by: ['priority'],
        where: { status: { not: 'CLOSED' } },
        _count: { _all: true },
      }),
    ]);

    // تیکت‌های بدون پاسخ در ۲۴ ساعت گذشته
    const unanswered = await prisma.ticket.count({
      where: {
        status: 'OPEN',
        updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    res.json({
      success: true,
      data: {
        byStatus:     Object.fromEntries(byStatus.map(s => [s.status, s._count._all])),
        byDepartment: Object.fromEntries(byDepartment.map(d => [d.department, d._count._all])),
        byPriority:   Object.fromEntries(byPriority.map(p => [p.priority, p._count._all])),
        unansweredOver24h: unanswered,
      },
    });
  } catch (error) {
    next(error);
  }
};
