// src/routes/review.routes.js
import { Router } from 'express';
import { createReview, getProductReviews, approveReview, rejectReview } from '../controllers/review.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/',                  protect, createReview);
router.get('/:productId',         getProductReviews);
router.patch('/:id/approve',      protect, isAdmin, approveReview);
router.patch('/:id/reject',       protect, isAdmin, rejectReview);

export default router;
