// src/routes/service.routes.js
import { Router } from 'express';
import { getServices, getService, createService, updateService, deleteService } from '../controllers/service.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/',       getServices);
router.get('/:slug',  getService);
router.post('/',      protect, isAdmin, createService);
router.put('/:id',    protect, isAdmin, updateService);
router.delete('/:id', protect, isAdmin, deleteService);

export default router;
