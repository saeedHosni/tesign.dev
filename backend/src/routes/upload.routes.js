// src/routes/upload.routes.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { rateLimit } from 'express-rate-limit';
import { uploadImage, deleteFile, uploadProjectFiles, uploadTicketFile } from '../controllers/upload.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

// Ensure uploads directories exist
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const projectFilesDir = path.join(uploadDir, 'project-files');
const ticketFilesDir  = path.join(uploadDir, 'ticket-files');
if (!fs.existsSync(uploadDir))       fs.mkdirSync(uploadDir,       { recursive: true });
if (!fs.existsSync(projectFilesDir)) fs.mkdirSync(projectFilesDir, { recursive: true });
if (!fs.existsSync(ticketFilesDir))  fs.mkdirSync(ticketFilesDir,  { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فقط فایل‌های تصویری مجاز هستند.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
});

// ─── Project lead reference files (public — order form, step 2) ───────────────
// Allows the kinds of "reference files" the order form promises: images, PDFs,
// zipped wireframe/design exports, and common design-file formats.
const projectFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, projectFilesDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const projectFileFilter = (_req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
    'application/x-photoshop', 'image/vnd.adobe.photoshop',
  ];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf', '.zip', '.psd', '.ai', '.fig', '.sketch'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('فرمت این فایل پشتیبانی نمی‌شود.'), false);
  }
};

const uploadProjectFile = multer({
  storage: projectFileStorage,
  fileFilter: projectFileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    files: 5,
  },
});

// Public endpoint, but rate-limited to prevent abuse since it requires no auth.
const projectFilesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'تعداد درخواست‌های آپلود زیاد است. لطفاً بعداً تلاش کنید.' },
});

const router = Router();

router.post('/image',         protect, isAdmin, upload.single('image'), uploadImage);
router.delete('/:filename',   protect, isAdmin, deleteFile);

router.post(
  '/project-files',
  projectFilesLimiter,
  uploadProjectFile.array('files', 5),
  uploadProjectFiles
);

// ─── آپلود پیوست تیکت (فقط ادمین) ────────────────────────────────────────────
const ticketFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ticketFilesDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const ticketFileFilter = (_req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'application/pdf', 'application/zip', 'application/x-zip-compressed',
  ];
  const allowedExts = ['.jpg','.jpeg','.png','.webp','.gif','.svg','.pdf','.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('فرمت این فایل پشتیبانی نمی‌شود.'), false);
  }
};

const uploadTicketFileMw = multer({
  storage:    ticketFileStorage,
  fileFilter: ticketFileFilter,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
});

router.post(
  '/ticket-file',
  protect,
  isAdmin,
  uploadTicketFileMw.single('file'),
  uploadTicketFile
);

export default router;