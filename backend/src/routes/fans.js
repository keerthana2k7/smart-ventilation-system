import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { getDbPool } from '../services/db.js';
import { fetchGasAndMotor, setMotorState } from '../services/arduinoCloud.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pool = await getDbPool();
    const [rows] = await pool.query('SELECT id, name, location, status, runtime_hours FROM fans WHERE user_id = ?', [req.user.id]);
    return res.json({ fans: rows });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, [
  body('name').isString().isLength({ min: 2 }),
  body('location').isString().isLength({ min: 2 }),
  body('device_id').isString().isLength({ min: 1 }),
  body('thing_id').optional().isString(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, location, device_id, thing_id } = req.body;
    const pool = await getDbPool();
    const [result] = await pool.query('INSERT INTO fans (user_id, name, location, device_id, thing_id) VALUES (?, ?, ?, ?, ?)', [req.user.id, name, location, device_id, thing_id || null]);
    return res.status(201).json({ id: result.insertId, name, location, device_id, thing_id, status: 'OFF', runtime_hours: 0, runtime_today: 0 });
  } catch (err) { next(err); }
});

export default router;

// Extra endpoints for IoT Cloud integration
router.get('/status', requireAuth, async (req, res, next) => {
  try {
    const pool = await getDbPool();
    const arduinoFanId = Number(process.env.ARDUINO_FAN_ID || 1);
    const [fans] = await pool.query('SELECT id, name, location, status, runtime_hours FROM fans WHERE user_id = ? AND id = ?', [req.user.id, arduinoFanId]);
    const base = fans[0] || { id: arduinoFanId, name: 'Fan', location: 'Unknown', status: 'OFF', runtime_hours: 0 };
    const cloud = await fetchGasAndMotor();
    return res.json({
      fan: base,
      gasLevel: cloud.gasLevel,
      motorState: cloud.motorState
    });
  } catch (err) { next(err); }
});

router.post('/control', requireAuth, [body('state').isBoolean()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    await setMotorState(req.body.state);
    // reflect in DB for mapped fan
    const pool = await getDbPool();
    const arduinoFanId = Number(process.env.ARDUINO_FAN_ID || 1);
    if (req.body.state) {
      await pool.query("UPDATE fans SET status='ON', last_on_at = IF(status='ON', last_on_at, NOW()) WHERE id = ?", [arduinoFanId]);
    } else {
      await pool.query(`
        UPDATE fans SET 
          runtime_hours = runtime_hours + IF(status='ON' AND last_on_at IS NOT NULL, TIMESTAMPDIFF(MINUTE, last_on_at, NOW())/60, 0),
          status='OFF', last_on_at=NULL
        WHERE id = ?
      `, [arduinoFanId]);
    }
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

