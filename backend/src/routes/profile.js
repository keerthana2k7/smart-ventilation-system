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
    return res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

router.post('/update', requireAuth, [
  body('name').optional().isString().isLength({ min: 2 }),
  body('email').optional().isEmail(),
  body('profile_photo').optional().isString()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, profile_photo } = req.body;
    const fields = [];
    const params = [];
    if (name) { fields.push('name=?'); params.push(name); }
    if (email) { fields.push('email=?'); params.push(email); }
    if (profile_photo) { fields.push('profile_photo=?'); params.push(profile_photo); }
    if (!fields.length) return res.json({ ok: true });
    params.push(req.user.id);
    const pool = await getDbPool();
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, params);
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;

