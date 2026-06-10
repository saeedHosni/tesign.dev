// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز. لطفاً وارد شوید.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'کاربر یافت نشد.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'حساب کاربری غیرفعال است.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'دسترسی غیرمجاز.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'دسترسی به این بخش برای شما مجاز نیست.',
      });
    }

    next();
  };
};

export const isAdmin    = requireRole('ADMIN', 'MANAGER');
export const isSuperAdmin = requireRole('ADMIN');

// Optional auth – attaches user if token exists, but doesn't block request
export const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true },
      });
      if (user) req.user = user;
    }
  } catch {
    // Silently ignore token errors for optional auth
  }
  next();
};
