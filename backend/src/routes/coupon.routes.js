// src/routes/coupon.routes.js
import { Router } from 'express';
import { validateCoupon, createCoupon, getCoupons, deleteCoupon } from '../controllers/coupon.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';
const router = Router();
router.post('/validate',  protect, validateCoupon);
router.get('/',           protect, isAdmin, getCoupons);
router.post('/',          protect, isAdmin, createCoupon);
router.delete('/:id',     protect, isAdmin, deleteCoupon);
export default router;
