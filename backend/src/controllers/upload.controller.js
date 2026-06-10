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
    const filePath = path.join(__dirname, '../../uploads', req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'فایل یافت نشد.' });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'فایل حذف شد.' });
  } catch (error) {
    next(error);
  }
};
