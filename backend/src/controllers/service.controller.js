// src/controllers/service.controller.js
import prisma from '../config/db.js';
import slugify from 'slugify';

// GET /api/services
export const getServices = async (req, res, next) => {
  try {
    const { admin } = req.query;
    const where = admin ? {} : { isActive: true };

    const services = await prisma.service.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        features: { orderBy: { sortOrder: 'asc' } },
        _count:   { select: { projectLeads: true } },
      },
    });

    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

// GET /api/services/:slug
export const getService = async (req, res, next) => {
  try {
    const service = await prisma.service.findFirst({
      where:   { slug: req.params.slug, isActive: true },
      include: { features: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'سرویس یافت نشد.' });
    }

    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// POST /api/services  [Admin]
export const createService = async (req, res, next) => {
  try {
    const { icon, category, title, description, features, sortOrder } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'عنوان و دسته سرویس الزامی است.' });
    }

    const baseSlug = slugify(title, { locale: 'fa', lower: true, strict: true }) || `service-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.service.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const service = await prisma.service.create({
      data: {
        slug,
        icon:        icon        || null,
        category,
        title,
        description: description || null,
        sortOrder:   sortOrder   || 0,
        features: {
          create: (features || []).map((label, i) => ({ label, sortOrder: i })),
        },
      },
      include: { features: true },
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// PUT /api/services/:id  [Admin]
export const updateService = async (req, res, next) => {
  try {
    const { icon, category, title, description, isActive, sortOrder, features } = req.body;

    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'سرویس یافت نشد.' });
    }

    const updates = {};
    if (icon        !== undefined) updates.icon        = icon;
    if (category    !== undefined) updates.category    = category;
    if (title       !== undefined) updates.title       = title;
    if (description !== undefined) updates.description = description;
    if (isActive    !== undefined) updates.isActive    = Boolean(isActive);
    if (sortOrder   !== undefined) updates.sortOrder   = Number(sortOrder);

    // Regenerate slug only if title actually changed
    if (title && title !== existing.title) {
      const baseSlug = slugify(title, { locale: 'fa', lower: true, strict: true }) || `service-${Date.now()}`;
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const found = await prisma.service.findUnique({ where: { slug } });
        if (!found || found.id === req.params.id) break;
        slug = `${baseSlug}-${counter++}`;
      }
      updates.slug = slug;
    }

    const service = await prisma.$transaction(async (tx) => {
      const updated = await tx.service.update({
        where: { id: req.params.id },
        data:  updates,
      });

      if (features !== undefined) {
        await tx.serviceFeature.deleteMany({ where: { serviceId: req.params.id } });
        if (features.length > 0) {
          await tx.serviceFeature.createMany({
            data: features.map((label, i) => ({
              serviceId: req.params.id,
              label,
              sortOrder: i,
            })),
          });
        }
      }

      return tx.service.findUnique({
        where:   { id: req.params.id },
        include: { features: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/services/:id  [Admin]  — soft delete
export const deleteService = async (req, res, next) => {
  try {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'سرویس یافت نشد.' });
    }

    await prisma.service.update({
      where: { id: req.params.id },
      data:  { isActive: false },
    });

    res.json({ success: true, message: 'سرویس غیرفعال شد.' });
  } catch (error) {
    next(error);
  }
};
