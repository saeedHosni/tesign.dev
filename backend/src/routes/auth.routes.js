// src/routes/auth.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import {
  register, login, refreshAccessToken, logout,
  getMe, updateProfile, changePassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('نام الزامی است.').isLength({ min: 2, max: 60 }),
    body('email').isEmail().normalizeEmail().withMessage('ایمیل معتبر وارد کنید.'),
    body('password').isLength({ min: 8 }).withMessage('رمز عبور باید حداقل ۸ کاراکتر باشد.'),
    body('phone').optional().matches(/^(\+98|0)?9\d{9}$/).withMessage('شماره موبایل معتبر وارد کنید.'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('ایمیل معتبر وارد کنید.'),
    body('password').notEmpty().withMessage('رمز عبور الزامی است.'),
  ],
  validate,
  login
);

router.post('/refresh',  refreshAccessToken);
router.post('/logout',   logout);

router.get('/me',   protect, getMe);
router.patch('/me', protect, [
  body('name').optional().trim().notEmpty().isLength({ min: 2, max: 60 }),
  body('phone').optional().matches(/^(\+98|0)?9\d{9}$/),
], validate, updateProfile);

router.patch('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('رمز عبور فعلی الزامی است.'),
  body('newPassword').isLength({ min: 8 }).withMessage('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.'),
], validate, changePassword);

export default router;
