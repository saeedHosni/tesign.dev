// src/routes/admin.routes.js
import { Router } from 'express';
import {
  // Users
  getUsers, updateUser, deleteUser, createAdminUser,
  // Analytics
  getAnalytics,
  // Orders
  getOrders, updateOrderStatus,
  // Reviews
  getReviews, deleteReview,
  // Coupons
  updateCoupon,
  // Categories
  getCategories, createCategory, updateCategory, deleteCategory,
  // Product Images
  addProductImage, deleteProductImage,
} from '../controllers/admin.controller.js';
import { protect, isAdmin, isSuperAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(protect, isAdmin);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users',              getUsers);
router.patch('/users/:id',        updateUser);
router.delete('/users/:id',       isSuperAdmin, deleteUser);
router.post('/users',             isSuperAdmin, createAdminUser);

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics',          getAnalytics);

// ─── Orders ───────────────────────────────────────────────────────────────────
router.get('/orders',             getOrders);
router.patch('/orders/:id',       updateOrderStatus);

// ─── Reviews ──────────────────────────────────────────────────────────────────
router.get('/reviews',            getReviews);
router.delete('/reviews/:id',     deleteReview);

// ─── Coupons ──────────────────────────────────────────────────────────────────
router.patch('/coupons/:id',      updateCoupon);

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories',         getCategories);
router.post('/categories',        createCategory);
router.patch('/categories/:id',   updateCategory);
router.delete('/categories/:id',  isSuperAdmin, deleteCategory);

// ─── Product Images ───────────────────────────────────────────────────────────
router.post('/products/:id/images',              addProductImage);
router.delete('/products/:id/images/:imageId',   deleteProductImage);

export default router;
