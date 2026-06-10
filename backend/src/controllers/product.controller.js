// src/controllers/product.controller.js
import prisma from '../config/db.js';
import slugify from 'slugify';

// GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sort = 'sortOrder',
      order = 'asc',
      featured,
      minPrice,
      maxPrice,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subtitle: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    const validSortFields = ['sortOrder', 'price', 'totalSales', 'rating', 'createdAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'sortOrder';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortField]: order === 'desc' ? 'desc' : 'asc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:slug
export const getProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { isApproved: true },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'محصول یافت نشد.',
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products  [Admin]
export const createProduct = async (req, res, next) => {
  try {
    const {
      name, subtitle, description, icon, categoryId,
      price, comparePrice, badge, isFeatured, stock,
      downloadUrl, tags, metadata, sortOrder,
    } = req.body;

    const baseSlug = slugify(name, { locale: 'fa', lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const product = await prisma.product.create({
      data: {
        slug,
        name,
        subtitle,
        description,
        icon,
        categoryId,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        badge,
        isFeatured: Boolean(isFeatured),
        stock: stock !== undefined ? Number(stock) : -1,
        downloadUrl,
        tags: tags || [],
        metadata,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'محصول ایجاد شد.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id  [Admin]
export const updateProduct = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.price) updates.price = Number(updates.price);
    if (updates.comparePrice) updates.comparePrice = Number(updates.comparePrice);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    if (updates.isFeatured !== undefined) updates.isFeatured = Boolean(updates.isFeatured);

    // Regenerate slug if name changed
    if (updates.name) {
      updates.slug = slugify(updates.name, { locale: 'fa', lower: true, strict: true });
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json({ success: true, message: 'محصول بروز شد.', data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id  [Admin]
export const deleteProduct = async (req, res, next) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'محصول حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/featured
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { sortOrder: 'asc' },
      take: 8,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};
