// src/routes/service.routes.js
import { Router } from 'express';
import {
  getServices,
  getService,
  createService,
  updateService,
  toggleService,
  deleteService,
  reorderServices,
} from '../controllers/service.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/',       getServices);   // ?admin=1 برای پنل ادمین (همه خدمات)
router.get('/:slug',  getService);

// ─── Admin ────────────────────────────────────────────────────────────────────
// ⚠️  reorder باید قبل از /:id ثبت شود تا "reorder" به عنوان id تفسیر نشود
router.patch('/reorder',        protect, isAdmin, reorderServices);

router.post('/',                protect, isAdmin, createService);
router.put('/:id',              protect, isAdmin, updateService);
router.patch('/:id/toggle',     protect, isAdmin, toggleService);
router.delete('/:id',           protect, isAdmin, deleteService);  // ?hard=1 برای حذف کامل

export default router;