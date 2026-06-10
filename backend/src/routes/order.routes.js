// src/routes/order.routes.js
import { Router } from 'express';
import {
  createOrder, getMyOrders, getOrder,
  confirmPayment, getAllOrders,
} from '../controllers/order.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/',             protect, createOrder);
router.get('/my',            protect, getMyOrders);
router.get('/admin/all',     protect, isAdmin, getAllOrders);
router.get('/:id',           protect, getOrder);
router.post('/:id/confirm',  protect, isAdmin, confirmPayment);

export default router;
