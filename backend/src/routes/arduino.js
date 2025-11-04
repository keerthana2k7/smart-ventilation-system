import { Router } from 'express';
import { getDbPool } from '../services/db.js';

const router = Router();

const GAS_THRESHOLD = Number(process.env.GAS_THRESHOLD || 200);

// ESP32: { fan_id, gas_level }
router.post('/data', async (req, res, next) => {
  try {
    const { fan_id, gas_level } = req.body || {};
    if (!fan_id || gas_level === undefined) return res.status(400).json({ message: 'fan_id and gas_level required' });
    const pool = await getDbPool();
    // store reading
    await pool.query('INSERT INTO fan_data (fan_id, gas_level) VALUES (?, ?)', [fan_id, gas_level]);
    // auto-control
    const shouldOn = Number(gas_level) > GAS_THRESHOLD;
    // update fan state and runtime accounting
    if (shouldOn) {
      await pool.query("UPDATE fans SET status='ON', last_on_at = IF(status='ON', last_on_at, NOW()) WHERE id = ?", [fan_id]);
    } else {
      // if turning OFF, add runtime since last_on_at
      await pool.query(`
        UPDATE fans SET 
          runtime_hours = runtime_hours + IF(status='ON' AND last_on_at IS NOT NULL, TIMESTAMPDIFF(MINUTE, last_on_at, NOW())/60, 0),
          status='OFF',
          last_on_at=NULL
        WHERE id = ?
      `, [fan_id]);
    }
    return res.status(201).json({ ok: true, action: shouldOn ? 'ON' : 'OFF' });
  } catch (err) { next(err); }
});

// Manual control
router.post('/control', async (req, res, next) => {
  try {
    const { fan_id, state } = req.body || {};
    if (!fan_id || !['ON','OFF'].includes(state)) return res.status(400).json({ message: 'fan_id and state=ON|OFF required' });
    const pool = await getDbPool();
    if (state === 'ON') {
      await pool.query("UPDATE fans SET status='ON', last_on_at = IF(status='ON', last_on_at, NOW()) WHERE id = ?", [fan_id]);
    } else {
      await pool.query(`
        UPDATE fans SET 
          runtime_hours = runtime_hours + IF(status='ON' AND last_on_at IS NOT NULL, TIMESTAMPDIFF(MINUTE, last_on_at, NOW())/60, 0),
          status='OFF',
          last_on_at=NULL
        WHERE id = ?
      `, [fan_id]);
    }
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

// Latest readings for charts
router.get('/data', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 1000);
    const fanId = Number(req.query.fan_id || 0);
    const pool = await getDbPool();
    const sql = fanId ? 'SELECT id, fan_id, gas_level, timestamp FROM fan_data WHERE fan_id=? ORDER BY id DESC LIMIT ?' : 'SELECT id, fan_id, gas_level, timestamp FROM fan_data ORDER BY id DESC LIMIT ?';
    const params = fanId ? [fanId, limit] : [limit];
    const [rows] = await pool.query(sql, params);
    return res.json({ data: rows.reverse() });
  } catch (err) { next(err); }
});

export default router;

