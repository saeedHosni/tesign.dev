// src/controllers/review.controller.js
import prisma from '../config/db.js';

// POST /api/reviews
export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, body } = req.body;

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

    const review = await prisma.review.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { rating: Number(rating), title, body, isApproved: false },
      create: {
        userId: req.user.id,
        productId,
        rating: Number(rating),
        title,
        body,
      },
    });

    // Recalculate product rating
    const stats = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count._all,
      },
    });

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
      prisma.review.count({
        where: { productId: req.params.productId, isApproved: true },
      }),
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
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: true },
    });

    // Recalculate
    const stats = await prisma.review.aggregate({
      where: { productId: review.productId, isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await prisma.product.update({
      where: { id: review.productId },
      data: { rating: stats._avg.rating || 0, reviewCount: stats._count._all },
    });

    res.json({ success: true, message: 'نظر تأیید شد.', data: review });
  } catch (error) {
    next(error);
  }
};
