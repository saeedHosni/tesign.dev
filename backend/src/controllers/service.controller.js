// src/controllers/service.controller.js
import prisma from '../config/db.js';
import slugify from 'slugify';

// GET /api/services
export const getServices = async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        features: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { projectLeads: true } },
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
      where: { slug: req.params.slug, isActive: true },
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

    const slug = slugify(title, { locale: 'fa', lower: true, strict: true });

    const service = await prisma.service.create({
      data: {
        slug,
        icon,
        category,
        title,
        description,
        sortOrder: sortOrder || 0,
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

    const service = await prisma.$transaction(async (tx) => {
      const updated = await tx.service.update({
        where: { id: req.params.id },
        data: { icon, category, title, description, isActive, sortOrder },
      });

      if (features !== undefined) {
        await tx.serviceFeature.deleteMany({ where: { serviceId: req.params.id } });
        await tx.serviceFeature.createMany({
          data: features.map((label, i) => ({
            serviceId: req.params.id,
            label,
            sortOrder: i,
          })),
        });
      }

      return updated;
    });

    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};
