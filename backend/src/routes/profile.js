import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { getDbPool } from '../services/db.js';

const router = Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const pool = await getDbPool();
    const [rows] = await pool.query('SELECT id, name, email, profile_photo FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const user = rows[0];
    // Convert profile_photo to full URL if it exists
    if (user.profile_photo && !user.profile_photo.startsWith('http')) {
      const baseUrl = process.env.PUBLIC_URL || process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      user.profile_photo = `${baseUrl}${user.profile_photo.startsWith('/') ? '' : '/'}${user.profile_photo}`;
    }
    return res.json({ user });
  } catch (err) { next(err); }
});

router.post('/update', requireAuth, [
  body('name').optional().isString().isLength({ min: 2 }),
  body('email').optional().isEmail(),
  body('profile_photo').optional().isString(),
  body('photo').optional().isString() // Accept 'photo' as alias for 'profile_photo'
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, profile_photo, photo } = req.body;
    const fields = [];
    const params = [];
    if (name) { fields.push('name=?'); params.push(name); }
    if (email) { fields.push('email=?'); params.push(email); }
    // Support both 'photo' and 'profile_photo' fields
    const photoValue = photo || profile_photo;
    if (photoValue) { fields.push('profile_photo=?'); params.push(photoValue); }
    if (!fields.length) return res.json({ ok: true });
    params.push(req.user.id);
    const pool = await getDbPool();
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, params);
    // Return updated user data
    const [updated] = await pool.query('SELECT id, name, email, profile_photo FROM users WHERE id = ?', [req.user.id]);
    const user = updated[0];
    if (user.profile_photo && !user.profile_photo.startsWith('http')) {
      const baseUrl = process.env.PUBLIC_URL || process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      user.profile_photo = `${baseUrl}${user.profile_photo.startsWith('/') ? '' : '/'}${user.profile_photo}`;
    }
    return res.json({ ok: true, user });
  } catch (err) { next(err); }
});

export default router;

