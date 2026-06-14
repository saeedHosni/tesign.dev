// src/routes/product.routes.js
import { Router } from 'express';
import {
  getProducts, getProduct, createProduct,
  updateProduct, deleteProduct, getFeaturedProducts,
  getCategories, getRelatedProducts,
} from '../controllers/product.controller.js';
import {
  // Features
  getProductFeatures, addProductFeature, updateProductFeature,
  deleteProductFeature, reorderProductFeatures,
  // FAQs
  getProductFAQs, addProductFAQ, updateProductFAQ,
  deleteProductFAQ, reorderProductFAQs,
  // Changelogs
  getProductChangelogs, addProductChangelog,
  updateProductChangelog, deleteProductChangelog,
  // Stats
  getProductStats, addProductStat, updateProductStat,
  deleteProductStat, reorderProductStats,
  // Bulk sync
  syncProductContent,
} from '../controllers/productContent.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/',               getProducts);
router.get('/featured',       getFeaturedProducts);
router.get('/categories',     getCategories);
// BUG FIX: static routes must be declared before /:slug to avoid conflicts
router.get('/:slug',          getProduct);
router.get('/:slug/related',  getRelatedProducts);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.post('/',        protect, isAdmin, createProduct);
router.put('/:id',      protect, isAdmin, updateProduct);
router.delete('/:id',   protect, isAdmin, deleteProduct);

// ─── Product Content (Features / FAQs / Changelogs / Stats) ──────────────────
// Note: :id here refers to product's UUID id (not slug)

// Bulk sync (save all content at once from admin panel)
router.put('/:id/content',    protect, isAdmin, syncProductContent);

// Features
router.get   ('/:id/features',                   getProductFeatures);
router.post  ('/:id/features',                   protect, isAdmin, addProductFeature);
router.patch ('/:id/features/reorder',           protect, isAdmin, reorderProductFeatures);
router.put   ('/:id/features/:featureId',        protect, isAdmin, updateProductFeature);
router.delete('/:id/features/:featureId',        protect, isAdmin, deleteProductFeature);

// FAQs
router.get   ('/:id/faqs',                       getProductFAQs);
router.post  ('/:id/faqs',                       protect, isAdmin, addProductFAQ);
router.patch ('/:id/faqs/reorder',               protect, isAdmin, reorderProductFAQs);
router.put   ('/:id/faqs/:faqId',                protect, isAdmin, updateProductFAQ);
router.delete('/:id/faqs/:faqId',               protect, isAdmin, deleteProductFAQ);

// Changelogs
router.get   ('/:id/changelogs',                 getProductChangelogs);
router.post  ('/:id/changelogs',                 protect, isAdmin, addProductChangelog);
router.put   ('/:id/changelogs/:changelogId',    protect, isAdmin, updateProductChangelog);
router.delete('/:id/changelogs/:changelogId',    protect, isAdmin, deleteProductChangelog);

// Stats
router.get   ('/:id/stats',                      getProductStats);
router.post  ('/:id/stats',                      protect, isAdmin, addProductStat);
router.patch ('/:id/stats/reorder',              protect, isAdmin, reorderProductStats);
router.put   ('/:id/stats/:statId',              protect, isAdmin, updateProductStat);
router.delete('/:id/stats/:statId',              protect, isAdmin, deleteProductStat);

export default router;
