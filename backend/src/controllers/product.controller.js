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
      admin,
    } = req.query;

    // BUG FIX: validate page and limit are positive numbers
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12)); // cap at 100
    const skip = (pageNum - 1) * limitNum;
    const where = {};

    // Only show active products to non-admin requests
    if (!admin) where.isActive = true;

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name:        { contains: search, mode: 'insensitive' } },
        { subtitle:    { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags:        { has: search } },
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

    const validSortFields = ['sortOrder', 'price', 'totalSales', 'rating', 'createdAt', 'name'];
    const sortField = validSortFields.includes(sort) ? sort : 'sortOrder';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: order === 'desc' ? 'desc' : 'asc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images:   { orderBy: { sortOrder: 'asc' }, take: 1 },
          _count:   { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
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
        images:   { orderBy: { sortOrder: 'asc' }, take: 1 },
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

// GET /api/products/:slug
export const getProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: {
        category: true,
        images:   { orderBy: { sortOrder: 'asc' } },
        features: { orderBy: { sortOrder: 'asc' } },
        faqs:     { orderBy: { sortOrder: 'asc' } },
        stats:    { orderBy: { sortOrder: 'asc' } },
        changelogs: {
          orderBy: { releasedAt: 'desc' },
          take: 10,
        },
        reviews: {
          where:   { isApproved: true },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// Helper: generate a unique slug
const generateUniqueSlug = async (name, excludeId = null) => {
  const baseSlug = slugify(name, { locale: 'fa', lower: true, strict: true }) || `product-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

// POST /api/products  [Admin]
export const createProduct = async (req, res, next) => {
  try {
    const {
      name, subtitle, description, icon, categoryId,
      price, comparePrice, badge, isFeatured, isActive,
      stock, downloadUrl, tags, metadata, sortOrder,
    } = req.body;

    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ success: false, message: 'نام، دسته‌بندی و قیمت الزامی است.' });
    }

    // BUG FIX: validate price is non-negative
    if (Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'قیمت نمی‌تواند منفی باشد.' });
    }

    // BUG FIX: validate comparePrice > price when both provided
    if (comparePrice !== undefined && comparePrice !== null && Number(comparePrice) <= Number(price)) {
      return res.status(400).json({ success: false, message: 'قیمت اصلی باید بیشتر از قیمت فروش باشد.' });
    }

    // Validate category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ success: false, message: 'دسته‌بندی یافت نشد.' });
    }

    const slug = await generateUniqueSlug(name);

    const product = await prisma.product.create({
      data: {
        slug,
        name,
        subtitle:     subtitle     || null,
        description:  description  || null,
        icon:         icon         || null,
        categoryId,
        price:        Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        badge:        badge        || null,
        isFeatured:   Boolean(isFeatured),
        isActive:     isActive !== undefined ? Boolean(isActive) : true,
        stock:        stock !== undefined ? Number(stock) : -1,
        downloadUrl:  downloadUrl  || null,
        tags:         tags || [],
        metadata:     metadata     || null,
        sortOrder:    sortOrder ? Number(sortOrder) : 0,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    res.status(201).json({ success: true, message: 'محصول ایجاد شد.', data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id  [Admin]
export const updateProduct = async (req, res, next) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    }

    const {
      name, subtitle, description, icon, categoryId,
      price, comparePrice, badge, isFeatured, isActive,
      stock, downloadUrl, tags, metadata, sortOrder,
    } = req.body;

    // BUG FIX: validate comparePrice logic
    const finalPrice        = price        !== undefined ? Number(price)        : existing.price;
    const finalComparePrice = comparePrice !== undefined ? (comparePrice ? Number(comparePrice) : null) : existing.comparePrice;

    if (finalComparePrice !== null && finalComparePrice <= finalPrice) {
      return res.status(400).json({ success: false, message: 'قیمت اصلی باید بیشتر از قیمت فروش باشد.' });
    }

    const updates = {};

    if (name        !== undefined) updates.name        = name;
    if (subtitle    !== undefined) updates.subtitle    = subtitle;
    if (description !== undefined) updates.description = description;
    if (icon        !== undefined) updates.icon        = icon;
    if (categoryId  !== undefined) updates.categoryId  = categoryId;
    if (price       !== undefined) updates.price       = Number(price);
    if (comparePrice !== undefined) updates.comparePrice = comparePrice ? Number(comparePrice) : null;
    if (badge       !== undefined) updates.badge       = badge;
    if (isFeatured  !== undefined) updates.isFeatured  = Boolean(isFeatured);
    if (isActive    !== undefined) updates.isActive    = Boolean(isActive);
    if (stock       !== undefined) updates.stock       = Number(stock);
    if (downloadUrl !== undefined) updates.downloadUrl = downloadUrl;
    if (tags        !== undefined) updates.tags        = tags;
    if (metadata    !== undefined) updates.metadata    = metadata;
    if (sortOrder   !== undefined) updates.sortOrder   = Number(sortOrder);

    // Only regenerate slug if name actually changed
    if (name && name !== existing.name) {
      updates.slug = await generateUniqueSlug(name, req.params.id);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ فیلدی برای بروزرسانی ارسال نشده.' });
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images:   { orderBy: { sortOrder: 'asc' } },
      },
    });

    res.json({ success: true, message: 'محصول بروز شد.', data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id  [Admin]  — soft delete
export const deleteProduct = async (req, res, next) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    }

    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'محصول غیرفعال شد.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id/related  — related products in same category
export const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, isActive: true },
      select: { id: true, categoryId: true },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
    }

    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        isActive: true,
        id: { not: product.id },
      },
      take: 4,
      orderBy: { totalSales: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images:   { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });

    res.json({ success: true, data: related });
  } catch (error) {
    next(error);
  }
};
