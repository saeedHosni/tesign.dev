// src/middleware/errorHandler.js

export const notFound = (req, res, next) => {
  const error = new Error(`مسیر یافت نشد: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, _next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'این مقدار قبلاً ثبت شده است.',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'رکورد مورد نظر یافت نشد.',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'توکن نامعتبر است.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'توکن منقضی شده است.',
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'خطای داخلی سرور',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
