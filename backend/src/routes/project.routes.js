// src/routes/project.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import {
  submitProjectLead, getProjectLeads, getProjectLeadById, updateProjectLead, getLeadStats, deleteProjectLeadFile,
} from '../controllers/project.controller.js';
import { protect, isAdmin, optionalAuth } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post(
  '/',
  optionalAuth,
  [
    body('email')
      .if(body('phone').isEmpty())
      .isEmail().withMessage('ایمیل یا شماره تماس الزامی است.'),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().matches(/^(\+98|0)?9\d{9}$/),
    body('subcategories').optional().isArray().withMessage('زیردسته‌ها باید آرایه باشند.'),
    body('subcategories.*').optional().isString().isLength({ max: 100 }),
    body('timeline').optional().isString().isLength({ max: 100 }),
    body('budget').optional().isString().isLength({ max: 100 }),
    body('description').optional().isString().isLength({ max: 5000 }),
    body('attachments').optional().isArray({ max: 5 }).withMessage('حداکثر ۵ فایل مرجع می‌توانید ارسال کنید.'),
    body('attachments.*.filename').optional().isString(),
  ],
  validate,
  submitProjectLead
);

router.get('/',          protect, isAdmin, getProjectLeads);
router.get('/stats',     protect, isAdmin, getLeadStats);
router.get('/:id',       protect, isAdmin, getProjectLeadById);
router.patch('/:id',     protect, isAdmin, updateProjectLead);
router.delete('/:id/files/:fileId', protect, isAdmin, deleteProjectLeadFile);

export default router;
