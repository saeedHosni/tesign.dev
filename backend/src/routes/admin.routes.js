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
import {
  // Main Categories
  getMainCategories, createMainCategory, updateMainCategory,
  deleteMainCategory, reorderMainCategories,
  // Subcategories
  getSubcategories, createSubcategory, updateSubcategory,
  deleteSubcategory, reorderSubcategories,
  // Budget Options
  getBudgetOptions, createBudgetOption, updateBudgetOption,
  deleteBudgetOption, reorderBudgetOptions,
  // Timeline Options
  getTimelineOptions, createTimelineOption, updateTimelineOption,
  deleteTimelineOption, reorderTimelineOptions,
  // Price Estimate Rules
  getPriceEstimateRules, createPriceEstimateRule,
  updatePriceEstimateRule, deletePriceEstimateRule,
} from '../controllers/orderFormConfig.controller.js';
import { protect, isAdmin, isSuperAdmin } from '../middleware/auth.middleware.js';
import adminTicketRoutes from './adminTicket.routes.js';

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
router.use('/tickets', adminTicketRoutes);

// ─── Reviews ──────────────────────────────────────────────────────────────────
router.get('/reviews',            getReviews);
router.delete('/reviews/:id',     deleteReview);

// ─── Coupons ──────────────────────────────────────────────────────────────────
router.patch('/coupons/:id',      updateCoupon);

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories',         getCategories);
router.post('/categories',        createCategory);
router.patch('/categories/:id',   updateCategory);
router.delete('/categories/:id',  deleteCategory);

// ─── Product Images ───────────────────────────────────────────────────────────
router.post('/products/:id/images',              addProductImage);
router.delete('/products/:id/images/:imageId',   deleteProductImage);

// ─── Order Form Config ────────────────────────────────────────────────────────
// دسته‌بندی‌های اصلی نوع پروژه
// ⚠️  reorder باید قبل از :id باشد تا "reorder" به عنوان ID تفسیر نشود
router.get   ('/order-config/main-categories',           getMainCategories);
router.post  ('/order-config/main-categories',           createMainCategory);
router.patch ('/order-config/main-categories/reorder',   reorderMainCategories);
router.patch ('/order-config/main-categories/:id',       updateMainCategory);
router.delete('/order-config/main-categories/:id',       deleteMainCategory);

// زیردسته‌های مرتبط
router.get   ('/order-config/subcategories',             getSubcategories);
router.post  ('/order-config/subcategories',             createSubcategory);
router.patch ('/order-config/subcategories/reorder',     reorderSubcategories);
router.patch ('/order-config/subcategories/:id',         updateSubcategory);
router.delete('/order-config/subcategories/:id',         deleteSubcategory);

// بازه‌های بودجه تقریبی
router.get   ('/order-config/budget-options',            getBudgetOptions);
router.post  ('/order-config/budget-options',            createBudgetOption);
router.patch ('/order-config/budget-options/reorder',    reorderBudgetOptions);
router.patch ('/order-config/budget-options/:id',        updateBudgetOption);
router.delete('/order-config/budget-options/:id',        deleteBudgetOption);

// بازه‌های زمانبندی مورد نظر
router.get   ('/order-config/timeline-options',          getTimelineOptions);
router.post  ('/order-config/timeline-options',          createTimelineOption);
router.patch ('/order-config/timeline-options/reorder',  reorderTimelineOptions);
router.patch ('/order-config/timeline-options/:id',      updateTimelineOption);
router.delete('/order-config/timeline-options/:id',      deleteTimelineOption);

// قوانین تخمین اولیه قیمت
router.get   ('/order-config/price-estimates',           getPriceEstimateRules);
router.post  ('/order-config/price-estimates',           createPriceEstimateRule);
router.patch ('/order-config/price-estimates/:id',       updatePriceEstimateRule);
router.delete('/order-config/price-estimates/:id',       deletePriceEstimateRule);

export default router;
// Note: Product content routes (features/faqs/changelogs/stats) are handled
// directly in /api/products/:id/* routes (product.routes.js) since they
// already apply protect + isAdmin middleware there.
