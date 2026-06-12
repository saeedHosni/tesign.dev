// src/routes/orderFormConfig.routes.js
//
// روت‌های عمومی فرم «ثبت سفارش» — نیازی به لاگین ندارند
// مورد استفاده فرانت برای رندر گزینه‌های فرم و دریافت تخمین قیمت

import { Router } from 'express';
import {
  getPublicOrderFormOptions,
  getPublicPriceEstimate,
} from '../controllers/orderFormConfig.controller.js';

const router = Router();

// GET /api/order-config        — همه گزینه‌های فعال (دسته‌بندی، بودجه، زمانبندی)
router.get('/', getPublicOrderFormOptions);

// GET /api/order-config/estimate?budgetValue=2m_5m&timelineValue=2m_3m
router.get('/estimate', getPublicPriceEstimate);

export default router;
