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

  // BUG FIX: handle Prisma foreign key constraint errors
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'رکورد مرتبط یافت نشد.',
      field: err.meta?.field_name,
    });
  }

  // BUG FIX: handle Prisma validation errors from schema
  if (err.code === 'P2006' || err.code === 'P2007') {
    return res.status(400).json({
      success: false,
      message: 'داده‌های ارسالی نامعتبر است.',
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

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'حجم فایل بیش از حد مجاز است.',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'فیلد فایل نامعتبر است.',
    });
  }

  // BUG FIX: handle multer "too many files" error
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'تعداد فایل‌های ارسالی بیش از حد مجاز است.',
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
