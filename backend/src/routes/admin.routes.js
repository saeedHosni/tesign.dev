// src/routes/admin.routes.js
import { Router } from 'express';
import { getUsers, updateUser, createAdminUser, getAnalytics } from '../controllers/admin.controller.js';
import { protect, isAdmin, isSuperAdmin } from '../middleware/auth.middleware.js';
const router = Router();
router.use(protect, isAdmin);
router.get('/users',          getUsers);
router.patch('/users/:id',    updateUser);
router.post('/users',         isSuperAdmin, createAdminUser);
router.get('/analytics',      getAnalytics);
export default router;
