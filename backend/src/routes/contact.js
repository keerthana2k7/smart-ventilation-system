import { Router } from 'express';
import { getDbPool } from '../services/db.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ message: 'Missing fields' });
    const pool = await getDbPool();
    await pool.query('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)', [name, email, message]);
    return res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;

