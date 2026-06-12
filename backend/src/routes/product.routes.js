// src/routes/product.routes.js
import { Router } from 'express';
import {
  getProducts, getProduct, createProduct,
  updateProduct, deleteProduct, getFeaturedProducts,
  getCategories, getRelatedProducts,
} from '../controllers/product.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/',               getProducts);
router.get('/featured',       getFeaturedProducts);
router.get('/categories',     getCategories);
// BUG FIX: static routes must be declared before /:slug to avoid conflicts
router.get('/:slug',          getProduct);
router.get('/:slug/related',  getRelatedProducts);

router.post('/',        protect, isAdmin, createProduct);
router.put('/:id',      protect, isAdmin, updateProduct);
router.delete('/:id',   protect, isAdmin, deleteProduct);

export default router;
