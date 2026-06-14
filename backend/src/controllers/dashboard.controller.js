// src/controllers/dashboard.controller.js
// پنل کاربری — مدیریت پروفایل، سفارشات، پروژه‌ها و دانلودها

import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

// ─── پروفایل ─────────────────────────────────────────────────────────────────

// GET /api/dashboard/profile
// دریافت اطلاعات کامل پروفایل کاربر به همراه آمار خلاصه
export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            projectLeads: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'کاربر یافت نشد.' });
    }

    // آمار سفارشات پرداخت‌شده
    const paidOrdersStats = await prisma.order.aggregate({
      where: { userId: req.user.id, paymentStatus: 'PAID' },
      _sum: { finalAmount: true },
      _count: { _all: true },
    });

    // آخرین پروژه ثبت‌شده
    const lastProject = await prisma.projectLead.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, projectType: true, status: true, createdAt: true },
    });

    res.json({
      success: true,
      data: {
        ...user,
        stats: {
          totalOrders: user._count.orders,
          totalProjects: user._count.projectLeads,
          paidOrders: paidOrdersStats._count._all,
          totalSpent: paidOrdersStats._sum.finalAmount || 0,
          lastProject,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/dashboard/profile
// بروزرسانی نام و شماره تلفن
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    // اگر شماره جدیدی وارد شده، چک کنیم تکراری نباشد
    if (phone) {
      const existing = await prisma.user.findFirst({
        where: { phone, NOT: { id: req.user.id } },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'این شماره تلفن قبلاً برای حساب دیگری ثبت شده است.',
        });
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name  !== undefined && { name }),
        ...(phone !== undefined && { phone: phone || null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
      },
    });

    res.json({ success: true, message: 'اطلاعات پروفایل بروز شد.', data: updated });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/dashboard/change-password
// تغییر رمز عبور (نیاز به رمز قبلی)
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'رمز عبور فعلی اشتباه است.',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'رمز عبور جدید نباید با رمز فعلی یکسان باشد.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    // بی‌اعتبار کردن تمام توکن‌های refresh برای امنیت
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });

    res.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر کرد. لطفاً دوباره وارد شوید.',
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/dashboard/change-email
// درخواست تغییر ایمیل (نیاز به رمز تأیید)
export const changeEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // تأیید رمز عبور
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'رمز عبور اشتباه است.',
      });
    }

    // چک تکراری نبودن ایمیل جدید
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'این ایمیل قبلاً توسط حساب دیگری استفاده شده است.',
      });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { email: newEmail, isVerified: false },
      select: { id: true, name: true, email: true, phone: true, isVerified: true },
    });

    res.json({
      success: true,
      message: 'ایمیل با موفقیت تغییر کرد.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ─── سفارشات فروشگاه ──────────────────────────────────────────────────────────

// GET /api/dashboard/orders
// لیست سفارشات کاربر با فیلتر و صفحه‌بندی
export const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { userId: req.user.id };
    if (status)        where.status        = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  icon: true,
                  thumbnailUrl: true,
                },
              },
            },
          },
          downloads: {
            select: {
              id: true,
              productName: true,
              token: true,
              expiresAt: true,
              downloadCount: true,
              maxDownloads: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
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

// GET /api/dashboard/orders/:id
// جزئیات کامل یک سفارش
export const getMyOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                thumbnailUrl: true,
                description: true,
              },
            },
          },
        },
        downloads: true,
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

// ─── دانلودها ─────────────────────────────────────────────────────────────────

// GET /api/dashboard/downloads
// لیست تمام فایل‌های قابل دانلود کاربر (از سفارشات پرداخت‌شده)
export const getMyDownloads = async (req, res, next) => {
  try {
    const downloads = await prisma.orderDownload.findMany({
      where: {
        order: {
          userId: req.user.id,
          paymentStatus: 'PAID',
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            paidAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: downloads });
  } catch (error) {
    next(error);
  }
};

// ─── پروژه‌ها (ثبت درخواست سفارش پروژه) ─────────────────────────────────────

// GET /api/dashboard/projects
// لیست پروژه‌های ثبت‌شده توسط کاربر
export const getMyProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const [projects, total] = await Promise.all([
      prisma.projectLead.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { id: true, title: true, slug: true, icon: true } },
          files: {
            select: {
              id: true,
              originalName: true,
              url: true,
              mimetype: true,
              size: true,
            },
          },
        },
      }),
      prisma.projectLead.count({ where }),
    ]);

    res.json({
      success: true,
      data: projects,
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

// GET /api/dashboard/projects/:id
// جزئیات کامل یک پروژه
export const getMyProject = async (req, res, next) => {
  try {
    const project = await prisma.projectLead.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        service: { select: { id: true, title: true, slug: true, icon: true } },
        files: true,
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'پروژه یافت نشد.' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// POST /api/dashboard/projects
// ثبت پروژه جدید توسط کاربر لاگین‌شده
// اطلاعات کاربر از توکن گرفته می‌شه — نیازی به ارسال مجدد نیست
export const submitMyProject = async (req, res, next) => {
  try {
    const {
      serviceId,
      projectType,
      subcategories,
      budget,
      timeline,
      description,
      attachments,
      source = 'dashboard',
    } = req.body;

    // بررسی serviceId
    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service) {
        return res.status(400).json({ success: false, message: 'سرویس انتخابی یافت نشد.' });
      }
    }

    // پاکسازی زیردسته‌ها
    let subcategoriesList = [];
    if (Array.isArray(subcategories)) {
      subcategoriesList = subcategories
        .filter((s) => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim());
    }

    // دریافت اطلاعات کاربر برای ذخیره در پروژه
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, email: true, phone: true },
    });

    // پردازش فایل‌های پیوست
    let attachmentsList = [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      if (attachments.length > 5) {
        return res.status(400).json({ success: false, message: 'حداکثر ۵ فایل مجاز است.' });
      }
      attachmentsList = attachments
        .filter((a) => a && typeof a.filename === 'string')
        .map((a) => ({
          filename: a.filename,
          originalName: a.originalName || null,
          url: a.url || '',
          mimetype: a.mimetype || null,
          size: Number.isFinite(Number(a.size)) ? Number(a.size) : null,
        }));
    }

    const project = await prisma.projectLead.create({
      data: {
        userId: req.user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        serviceId: serviceId || null,
        projectType,
        subcategories: subcategoriesList,
        budget,
        timeline,
        description,
        source,
        files: attachmentsList.length > 0 ? { create: attachmentsList } : undefined,
      },
      include: {
        service: { select: { id: true, title: true, slug: true } },
        files: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'پروژه شما با موفقیت ثبت شد. تیم ما ظرف ۲۴ ساعت با شما تماس می‌گیرد.',
      data: { id: project.id, status: project.status, createdAt: project.createdAt },
    });
  } catch (error) {
    next(error);
  }
};

// ─── آمار داشبورد ─────────────────────────────────────────────────────────────

// GET /api/dashboard/summary
// خلاصه کامل داشبورد برای نمایش در صفحه اصلی پنل
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [
      user,
      orderStats,
      recentOrders,
      projectStats,
      recentProjects,
      downloadsCount,
      ticketOpenCount,
      recentTickets,
    ] = await Promise.all([
      // اطلاعات پایه کاربر
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      }),

      // آمار سفارشات
      prisma.order.groupBy({
        by: ['paymentStatus'],
        where: { userId },
        _count: { _all: true },
        _sum: { finalAmount: true },
      }),

      // ۳ سفارش اخیر
      prisma.order.findMany({
        where: { userId },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          finalAmount: true,
          createdAt: true,
          items: {
            take: 1,
            select: {
              product: { select: { name: true, icon: true } },
            },
          },
        },
      }),

      // آمار پروژه‌ها
      prisma.projectLead.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      }),

      // ۲ پروژه اخیر
      prisma.projectLead.findMany({
        where: { userId },
        take: 2,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          projectType: true,
          status: true,
          createdAt: true,
          service: { select: { title: true, icon: true } },
        },
      }),

      // تعداد دانلودهای فعال
      prisma.orderDownload.count({
        where: {
          order: { userId, paymentStatus: 'PAID' },
          expiresAt: { gt: new Date() },
        },
      }),

      // تعداد تیکت‌های باز
      prisma.ticket.count({
        where: { userId, status: { in: ['OPEN', 'ANSWERED', 'PENDING'] } },
      }),

      // ۳ تیکت اخیر
      prisma.ticket.findMany({
        where: { userId },
        take: 3,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          status: true,
          department: true,
          priority: true,
          updatedAt: true,
        },
      }),
    ]);

    // پردازش آمار سفارشات
    const orderSummary = {
      total: 0,
      paid: 0,
      unpaid: 0,
      totalSpent: 0,
    };
    for (const s of orderStats) {
      orderSummary.total += s._count._all;
      if (s.paymentStatus === 'PAID') {
        orderSummary.paid = s._count._all;
        orderSummary.totalSpent = s._sum.finalAmount || 0;
      } else if (s.paymentStatus === 'UNPAID') {
        orderSummary.unpaid = s._count._all;
      }
    }

    // پردازش آمار پروژه‌ها
    const projectSummary = {
      total: 0,
      new: 0,
      inProgress: 0,
      converted: 0,
    };
    for (const s of projectStats) {
      projectSummary.total += s._count._all;
      if (s.status === 'NEW')         projectSummary.new = s._count._all;
      if (s.status === 'IN_PROGRESS') projectSummary.inProgress = s._count._all;
      if (s.status === 'CONVERTED')   projectSummary.converted = s._count._all;
    }

    res.json({
      success: true,
      data: {
        user,
        orders: {
          summary: orderSummary,
          recent: recentOrders,
        },
        projects: {
          summary: projectSummary,
          recent: recentProjects,
        },
        downloads: {
          activeCount: downloadsCount,
        },
        tickets: {
          openCount: ticketOpenCount,
          recent: recentTickets,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};