import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getDbPool } from '../services/db.js';

const router = Router();

router.post(
  '/signup',
  [
    body('name').isString().isLength({ min: 2 }),
    body('email').isEmail(),
    body('password').isString().isLength({ min: 6 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, email, password } = req.body;
      const pool = await getDbPool();

      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) return res.status(409).json({ message: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, passwordHash]);
      return res.status(201).json({ message: 'Registered successfully' });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').isString()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const pool = await getDbPool();
      const [rows] = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

      const user = rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
      // Get full user data including profile_photo (use same query but select profile_photo)
      const [userData] = await pool.query('SELECT id, name, email, profile_photo FROM users WHERE id = ?', [user.id]);
      const fullUser = userData[0] || { id: user.id, name: user.name, email: user.email, profile_photo: null };
      // Convert profile_photo to full URL if it exists
      if (fullUser.profile_photo && !fullUser.profile_photo.startsWith('http')) {
        const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        fullUser.profile_photo = `${baseUrl}${fullUser.profile_photo.startsWith('/') ? '' : '/'}${fullUser.profile_photo}`;
      }
      return res.json({ token, user: fullUser });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

