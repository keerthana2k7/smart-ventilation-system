import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbPool } from '../services/db.js';
import { requireAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const upload = multer({ storage });

const router = Router();

router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    const pool = await getDbPool();
    const filePath = `/uploads/${file.filename}`;
    await pool.query(
      `INSERT INTO uploads (filename, path, mimetype, size) VALUES (?, ?, ?, ?)`,
      [file.filename, filePath, file.mimetype, file.size]
    );
    // Return full URL
    const baseUrl = process.env.PUBLIC_URL || process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fullUrl = `${baseUrl}${filePath}`;
    return res.status(201).json({
      message: 'Uploaded',
      file: { filename: file.filename, url: fullUrl, path: filePath }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

