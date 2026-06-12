// src/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/db.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, jti: uuidv4() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'این ایمیل قبلاً ثبت شده است.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, phone: phone || null, passwordHash },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      success: true,
      message: 'ثبت‌نام با موفقیت انجام شد.',
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: 'ایمیل یا رمز عبور اشتباه است.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'حساب کاربری شما غیرفعال شده است.',
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'ورود موفق.',
      data: { user: userWithoutPassword, accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'توکن بازنشانی ارائه نشده است.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'توکن بازنشانی نامعتبر یا منقضی است.',
      });
    }

    // Check in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'توکن بازنشانی معتبر نیست.',
      });
    }

    // ✅ FIX: Rotate با transaction — جلوگیری از race condition
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: refreshToken } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: decoded.userId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    res.json({ success: true, message: 'خروج موفق.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/me
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
    });

    res.json({ success: true, message: 'پروفایل بروز شد.', data: user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(400).json({
        success: false,
        message: 'رمز عبور فعلی اشتباه است.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });

    res.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر کرد. لطفاً دوباره وارد شوید.',
    });
  } catch (error) {
    next(error);
  }
};