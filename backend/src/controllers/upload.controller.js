// src/controllers/upload.controller.js
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// POST /api/upload/image  [Admin]
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'فایلی آپلود نشد.' });
    }

    const relativePath = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'فایل آپلود شد.',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: relativePath,
        url: `${process.env.BASE_URL || 'http://localhost:5000'}${relativePath}`,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/upload/:filename  [Admin]
export const deleteFile = async (req, res, next) => {
  try {
    // BUG FIX: prevent path traversal via crafted filenames
    const filename = path.basename(req.params.filename);
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'فایل یافت نشد.' });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'فایل حذف شد.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/upload/project-files  [Public, rate-limited]
// Used by the order form (step 2) to upload reference files (logo, wireframe,
// design samples, etc.) before/while submitting a project lead.
export const uploadProjectFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'فایلی آپلود نشد.' });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    const files = req.files.map((file) => {
      const relativePath = `/uploads/project-files/${file.filename}`;
      return {
        filename: file.filename,
        originalName: file.originalname,
        path: relativePath,
        url: `${baseUrl}${relativePath}`,
        size: file.size,
        mimetype: file.mimetype,
      };
    });

    res.status(201).json({
      success: true,
      message: 'فایل‌ها آپلود شدند.',
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/upload/ticket-file  [Admin]
// آپلود پیوست برای پاسخ ادمین به تیکت
export const uploadTicketFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'فایلی آپلود نشد.' });
    }

    const baseUrl      = process.env.BASE_URL || 'http://localhost:5000';
    const relativePath = `/uploads/ticket-files/${req.file.filename}`;

    res.status(201).json({
      success: true,
      message: 'فایل پیوست آپلود شد.',
      data: {
        filename:     req.file.filename,
        originalName: req.file.originalname,
        path:         relativePath,
        url:          `${baseUrl}${relativePath}`,
        size:         req.file.size,
        mimetype:     req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
};