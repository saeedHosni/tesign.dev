// src/routes/dashboard.routes.js
// پنل کاربری — مسیرهای API

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getProfile,
  updateProfile,
  changePassword,
  changeEmail,
  getMyOrders,
  getMyOrder,
  getMyDownloads,
  getMyProjects,
  getMyProject,
  submitMyProject,
  getDashboardSummary,
} from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import ticketRoutes from './ticket.routes.js';


const router = Router();

// تمام مسیرهای پنل نیاز به احراز هویت دارند
router.use(protect);

// ─── پروفایل ──────────────────────────────────────────────────────────────────
router.get('/profile', getProfile);

router.patch(
  '/profile',
  [
    body('name')
      .optional()
      .trim()
      .notEmpty().withMessage('نام نمی‌تواند خالی باشد.')
      .isLength({ min: 2, max: 60 }).withMessage('نام باید بین ۲ تا ۶۰ کاراکتر باشد.'),
    body('phone')
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^(\+98|0)?9\d{9}$/).withMessage('شماره موبایل معتبر وارد کنید.'),
  ],
  validate,
  updateProfile
);

router.patch(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('رمز عبور فعلی الزامی است.'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.')
      .not().equals('currentPassword').withMessage('رمز عبور جدید نباید با فعلی یکسان باشد.'),
  ],
  validate,
  changePassword
);

router.patch(
  '/change-email',
  [
    body('newEmail')
      .isEmail().normalizeEmail().withMessage('آدرس ایمیل معتبر وارد کنید.'),
    body('password')
      .notEmpty().withMessage('رمز عبور برای تأیید الزامی است.'),
  ],
  validate,
  changeEmail
);

// ─── سفارشات فروشگاه ──────────────────────────────────────────────────────────
router.get(
  '/orders',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('status')
      .optional()
      .isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED']),
    query('paymentStatus')
      .optional()
      .isIn(['UNPAID', 'PAID', 'FAILED', 'REFUNDED']),
  ],
  validate,
  getMyOrders
);

router.get(
  '/orders/:id',
  [param('id').isUUID().withMessage('شناسه سفارش نامعتبر است.')],
  validate,
  getMyOrder
);

// ─── دانلودها ─────────────────────────────────────────────────────────────────
router.get('/downloads', getMyDownloads);

// ─── پروژه‌ها ─────────────────────────────────────────────────────────────────
router.get(
  '/projects',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('status')
      .optional()
      .isIn(['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED']),
  ],
  validate,
  getMyProjects
);

router.get(
  '/projects/:id',
  [param('id').isUUID().withMessage('شناسه پروژه نامعتبر است.')],
  validate,
  getMyProject
);

router.post(
  '/projects',
  [
    body('serviceId').optional().isUUID().withMessage('شناسه سرویس نامعتبر است.'),
    body('projectType')
      .optional()
      .isString()
      .isLength({ max: 100 }).withMessage('نوع پروژه نباید بیشتر از ۱۰۰ کاراکتر باشد.'),
    body('subcategories')
      .optional()
      .isArray().withMessage('زیردسته‌ها باید آرایه باشند.'),
    body('subcategories.*')
      .optional()
      .isString().isLength({ max: 100 }),
    body('budget')
      .optional()
      .isString().isLength({ max: 100 }).withMessage('بودجه نباید بیشتر از ۱۰۰ کاراکتر باشد.'),
    body('timeline')
      .optional()
      .isString().isLength({ max: 100 }).withMessage('بازه زمانی نباید بیشتر از ۱۰۰ کاراکتر باشد.'),
    body('description')
      .optional()
      .isString().isLength({ max: 5000 }).withMessage('توضیحات نباید بیشتر از ۵۰۰۰ کاراکتر باشد.'),
    body('attachments')
      .optional()
      .isArray({ max: 5 }).withMessage('حداکثر ۵ فایل مجاز است.'),
    body('attachments.*.filename')
      .optional()
      .isString(),
  ],
  validate,
  submitMyProject
);

// ─── خلاصه داشبورد ────────────────────────────────────────────────────────────
router.get('/summary', getDashboardSummary);
router.use('/tickets', ticketRoutes);

export default router;
