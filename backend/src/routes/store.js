import { Router } from 'express';
import { getDbPool } from '../services/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const pool = await getDbPool();
    const [rows] = await pool.query('SELECT id, name, description, price, image FROM products ORDER BY id DESC');
    return res.json({ products: rows });
  } catch (err) { next(err); }
});

export default router;

