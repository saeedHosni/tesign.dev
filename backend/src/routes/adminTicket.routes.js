// src/routes/adminTicket.routes.js
// تیکت پشتیبانی — مسیرهای ادمین
// این فایل در admin.routes.js ادغام می‌شود (دستورالعمل پایین)

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  adminGetTickets,
  adminGetTicket,
  adminReplyTicket,
  adminUpdateTicket,
  adminGetTicketStats,
} from '../controllers/ticket.controller.js';
import validate from '../middleware/validate.js';

const router = Router();
// middleware احراز هویت ادمین از admin.routes.js به ارث می‌رسد

// ─── آمار تیکت‌ها (باید قبل از /:id باشد) ───────────────────────────────────
router.get('/stats', adminGetTicketStats);

// ─── لیست همه تیکت‌ها ────────────────────────────────────────────────────────
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status')
      .optional()
      .isIn(['OPEN', 'ANSWERED', 'PENDING', 'CLOSED'])
      .withMessage('وضعیت نامعتبر است.'),
    query('department')
      .optional()
      .isIn(['SUPPORT', 'TECHNICAL', 'SALES', 'ORDER'])
      .withMessage('دپارتمان نامعتبر است.'),
    query('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH'])
      .withMessage('اولویت نامعتبر است.'),
  ],
  validate,
  adminGetTickets
);

// ─── جزئیات تیکت ─────────────────────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID().withMessage('شناسه تیکت نامعتبر است.')],
  validate,
  adminGetTicket
);

// ─── پاسخ به تیکت ────────────────────────────────────────────────────────────
router.post(
  '/:id/messages',
  [
    param('id').isUUID().withMessage('شناسه تیکت نامعتبر است.'),

    body('body')
      .trim()
      .notEmpty().withMessage('متن پیام الزامی است.')
      .isLength({ min: 2, max: 10000 }).withMessage('پیام باید بین ۲ تا ۱۰۰۰۰ کاراکتر باشد.'),

    body('isInternal')
      .optional()
      .isBoolean().withMessage('مقدار isInternal باید boolean باشد.'),

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
  adminReplyTicket
);

// ─── تغییر وضعیت / اولویت / assign ──────────────────────────────────────────
router.patch(
  '/:id',
  [
    param('id').isUUID().withMessage('شناسه تیکت نامعتبر است.'),

    body('status')
      .optional()
      .isIn(['OPEN', 'ANSWERED', 'PENDING', 'CLOSED'])
      .withMessage('وضعیت نامعتبر است.'),

    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH'])
      .withMessage('اولویت نامعتبر است.'),

    body('assignedTo')
      .optional({ nullable: true })
      .custom(val => val === null || typeof val === 'string')
      .withMessage('شناسه ادمین نامعتبر است.'),
  ],
  validate,
  adminUpdateTicket
);

export default router;