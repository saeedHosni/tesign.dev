// src/routes/settings.routes.js
import { Router } from 'express';
import {
  getPublicSettings, getSettings, updateSettings,
  getDashboardStats, updateTicker, updateSiteStats,
} from '../controllers/settings.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/public',        getPublicSettings);        // no auth – used by frontend on load
router.get('/dashboard',     protect, isAdmin, getDashboardStats);
router.get('/',              protect, isAdmin, getSettings);
router.put('/',              protect, isAdmin, updateSettings);
router.put('/ticker',        protect, isAdmin, updateTicker);
router.put('/stats',         protect, isAdmin, updateSiteStats);
export default router;
