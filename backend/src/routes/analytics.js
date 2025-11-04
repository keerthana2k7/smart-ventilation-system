import { Router } from 'express';
import { getDbPool } from '../services/db.js';

const router = Router();

// Returns runtime (hours) per day and average gas for last 30 days
router.get('/', async (req, res, next) => {
  try {
    const fanId = Number(req.query.fan_id || 0);
    if (!fanId) return res.status(400).json({ message: 'fan_id required' });
    const pool = await getDbPool();
    const threshold = Number(process.env.GAS_THRESHOLD || 200);

    const [rows] = await pool.query(
      `SELECT DATE(timestamp) as day,
              AVG(gas_level) as avg_gas,
              SUM(CASE WHEN gas_level > ? THEN 1 ELSE 0 END) as on_points
       FROM fan_data
       WHERE fan_id = ? AND timestamp >= NOW() - INTERVAL 30 DAY
       GROUP BY DATE(timestamp)
       ORDER BY day ASC`,
      [threshold, fanId]
    );

    // Assume ~1 minute between points; convert to hours
    const series = rows.map(r => ({
      day: r.day,
      runtime_hours: Number(r.on_points) / 60,
      avg_gas: Number(r.avg_gas)
    }));

    return res.json({ series });
  } catch (err) { next(err); }
});

export default router;

