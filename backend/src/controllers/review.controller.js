// src/controllers/review.controller.js
import prisma from '../config/db.js';

// Helper: recalculate and update product rating
const recalculateProductRating = async (productId) => {
  const stats = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating:      Math.round((stats._avg.rating || 0) * 10) / 10,
      reviewCount: stats._count._all,
    },
  });
};

// POST /api/reviews
export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, body } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ success: false, message: 'شناسه محصول و امتیاز الزامی است.' });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'امتیاز باید عددی بین ۱ تا ۵ باشد.' });
    }

    // Verify product exists and is active
    const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    }

    // Verify user purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId: req.user.id, paymentStatus: 'PAID' },
      },
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'فقط خریداران این محصول می‌توانند نظر بگذارند.',
      });
    }

    // BUG FIX: sanitize title/body length to prevent very long inputs
    const sanitizedTitle = title ? String(title).slice(0, 200) : undefined;
    const sanitizedBody  = body  ? String(body).slice(0, 2000) : undefined;

    const review = await prisma.review.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { rating: ratingNum, title: sanitizedTitle, body: sanitizedBody, isApproved: false },
      create: {
        userId: req.user.id,
        productId,
        rating: ratingNum,
        title:  sanitizedTitle,
        body:   sanitizedBody,
      },
    });

    await recalculateProductRating(productId);

    res.status(201).json({
      success: true,
      message: 'نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/:productId
export const getProductReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId: req.params.productId, isApproved: true },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.review.count({ where: { productId: req.params.productId, isApproved: true } }),
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/reviews/:id/approve  [Admin]
export const approveReview = async (req, res, next) => {
  try {
    const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'نظر یافت نشد.' });
    }

    // BUG FIX: don't approve an already-approved review
    if (existing.isApproved) {
      return res.status(400).json({ success: false, message: 'این نظر قبلاً تأیید شده است.' });
    }

    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: true },
    });

    await recalculateProductRating(review.productId);

    res.json({ success: true, message: 'نظر تأیید شد.', data: review });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/reviews/:id/reject  [Admin]
export const rejectReview = async (req, res, next) => {
  try {
    const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'نظر یافت نشد.' });
    }

    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: false },
    });

    await recalculateProductRating(review.productId);

    res.json({ success: true, message: 'نظر رد شد.', data: review });
  } catch (error) {
    next(error);
  }
};
