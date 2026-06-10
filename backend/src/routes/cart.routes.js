// src/routes/cart.routes.js
import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.middleware.js';
const router = Router();
router.use(protect);
router.get('/',                  getCart);
router.post('/add',              addToCart);
router.patch('/item/:itemId',    updateCartItem);
router.delete('/item/:itemId',   removeFromCart);
router.delete('/clear',          clearCart);
export default router;
