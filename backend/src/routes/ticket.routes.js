// src/routes/ticket.routes.js
// تیکت پشتیبانی — مسیرهای API کاربری

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createTicket,
  getMyTickets,
  getMyTicket,
  addMyTicketMessage,
  closeMyTicket,
} from '../controllers/ticket.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';

const router = Router();

// تمام مسیرها نیاز به احراز هویت دارند
router.use(protect);

// ─── ثبت تیکت جدید ───────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('subject')
      .trim()
      .notEmpty().withMessage('موضوع تیکت الزامی است.')
      .isLength({ min: 5, max: 200 }).withMessage('موضوع باید بین ۵ تا ۲۰۰ کاراکتر باشد.'),

    body('body')
      .trim()
      .notEmpty().withMessage('متن پیام الزامی است.')
      .isLength({ min: 10, max: 5000 }).withMessage('پیام باید بین ۱۰ تا ۵۰۰۰ کاراکتر باشد.'),

    body('department')
      .optional()
      .isIn(['SUPPORT', 'TECHNICAL', 'SALES', 'ORDER'])
      .withMessage('دپارتمان نامعتبر است.'),

    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH'])
      .withMessage('اولویت نامعتبر است.'),

    body('orderId')
      .optional({ nullable: true })
      .isUUID().withMessage('شناسه سفارش نامعتبر است.'),

    body('attachments')
      .optional()
      .isArray({ max: 5 }).withMessage('حداکثر ۵ فایل پیوست مجاز است.'),

    body('attachments.*.url')
      .optional()
      .isURL().withMessage('آدرس فایل پیوست نامعتبر است.'),
  ],
  validate,
  createTicket
);

// ─── لیست تیکت‌های کاربر ─────────────────────────────────────────────────────
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('status')
      .optional()
      .isIn(['OPEN', 'ANSWERED', 'PENDING', 'CLOSED'])
      .withMessage('وضعیت نامعتبر است.'),
    query('department')
      .optional()
      .isIn(['SUPPORT', 'TECHNICAL', 'SALES', 'ORDER'])
      .withMessage('دپارتمان نامعتبر است.'),
  ],
  validate,
  getMyTickets
);

// ─── جزئیات تیکت ─────────────────────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID().withMessage('شناسه تیکت نامعتبر است.')],
  validate,
  getMyTicket
);

// ─── ارسال پیام جدید در تیکت ─────────────────────────────────────────────────
router.post(
  '/:id/messages',
  [
    param('id').isUUID().withMessage('شناسه تیکت نامعتبر است.'),

    body('body')
      .trim()
      .notEmpty().withMessage('متن پیام الزامی است.')
      .isLength({ min: 2, max: 5000 }).withMessage('پیام باید بین ۲ تا ۵۰۰۰ کاراکتر باشد.'),

    body('attachments')
      .optional()
      .isArray({ max: 5 }).withMessage('حداکثر ۵ فایل پیوست مجاز است.'),

    body('attachments.*.url')
  .optional()
  .isString()
  .notEmpty()
  .withMessage('آدرس فایل پیوست نامعتبر است.'),
  ],
  validate,
  addMyTicketMessage
);

// ─── بستن تیکت توسط کاربر ────────────────────────────────────────────────────
router.patch(
  '/:id/close',
  [param('id').isUUID().withMessage('شناسه تیکت نامعتبر است.')],
  validate,
  closeMyTicket
);

export default router;
