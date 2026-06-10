// src/routes/service.routes.js
import { Router } from 'express';
import { getServices, getService, createService, updateService } from '../controllers/service.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/',      getServices);
router.get('/:slug', getService);
router.post('/',     protect, isAdmin, createService);
router.put('/:id',   protect, isAdmin, updateService);
export default router;
