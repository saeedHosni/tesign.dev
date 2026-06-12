// src/routes/order.routes.js
import { Router } from 'express';
import {
  createOrder, getMyOrders, getOrder,
  confirmPayment, getAllOrders, downloadByToken,
} from '../controllers/order.controller.js';
import { protect, isAdmin, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/',              protect, createOrder);
router.get('/my',             protect, getMyOrders);
router.get('/admin/all',      protect, isAdmin, getAllOrders);
// BUG FIX: download route must come before /:id to avoid route conflict
router.get('/download/:token', optionalAuth, downloadByToken);
router.get('/:id',            protect, getOrder);
router.post('/:id/confirm',   protect, isAdmin, confirmPayment);

export default router;
