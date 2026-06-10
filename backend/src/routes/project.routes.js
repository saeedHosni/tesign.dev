// src/routes/project.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import {
  submitProjectLead, getProjectLeads, updateProjectLead, getLeadStats,
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
  ],
  validate,
  submitProjectLead
);

router.get('/',          protect, isAdmin, getProjectLeads);
router.get('/stats',     protect, isAdmin, getLeadStats);
router.patch('/:id',     protect, isAdmin, updateProjectLead);

export default router;
