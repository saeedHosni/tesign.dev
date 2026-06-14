// src/routes/payment.routes.js
import { Router } from 'express';
import { requestPayment, verifyPayment } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/payment/request  — ثبت سفارش + گرفتن authority از زرین‌پال
router.post('/request', protect, requestPayment);

// POST /api/payment/verify   — تأیید پرداخت بعد از برگشت کاربر
router.post('/verify', protect, verifyPayment);

export default router;