import { Router } from 'express';
import { getDbPool } from '../services/db.js';

const router = Router();

// Arduino IoT Cloud Webhook Handler
router.post('/webhook', async (req, res, next) => {
  try {
    const payload = req.body;
    
    // Validate payload structure
    if (!payload || !payload.values || !Array.isArray(payload.values)) {
      return res.status(400).json({ message: 'Invalid payload structure' });
    }

    const deviceId = payload.device_id;
    if (!deviceId) {
      // Silently ignore if device_id is missing
      return res.status(200).json({ ok: true, message: 'No device_id, ignored' });
    }

    const pool = await getDbPool();
    
    // Find fan by device_id
    const [fans] = await pool.query('SELECT id FROM fans WHERE device_id = ?', [deviceId]);
    
    if (fans.length === 0) {
      // Silently ignore if device not found
      return res.status(200).json({ ok: true, message: 'Device not found, ignored' });
    }

    const fanId = fans[0].id;
    let gasLevel = null;
    let motorState = false;

    // Extract values from payload
    for (const value of payload.values) {
      if (value.name === 'gasLevel' && value.value !== undefined) {
        gasLevel = parseFloat(value.value);
      }
      if (value.name === 'motorState' || value.name === 'motor_state') {
        motorState = value.value === true || value.value === 'true' || value.value === 1 || value.value === '1';
      }
    }

    // Insert into fan_readings table
    if (gasLevel !== null) {
      await pool.query(
        'INSERT INTO fan_readings (fan_id, gas_level, motor_state, timestamp) VALUES (?, ?, ?, NOW())',
        [fanId, gasLevel, motorState ? 1 : 0]
      );

      // Update runtime if motor_state is true
      if (motorState) {
        // If turning ON, set last_on_at if not already ON
        await pool.query(
          "UPDATE fans SET status='ON', last_on_at = IF(status='ON', last_on_at, NOW()) WHERE id = ?",
          [fanId]
        );
      } else {
        // If turning OFF, calculate and add runtime
        await pool.query(`
          UPDATE fans SET 
            runtime_hours = runtime_hours + IF(status='ON' AND last_on_at IS NOT NULL, TIMESTAMPDIFF(MINUTE, last_on_at, NOW())/60, 0),
            runtime_today = runtime_today + IF(status='ON' AND last_on_at IS NOT NULL AND DATE(last_on_at) = CURDATE(), TIMESTAMPDIFF(MINUTE, last_on_at, NOW())/60, 0),
            status='OFF',
            last_on_at=NULL
          WHERE id = ?
        `, [fanId]);
      }
    }

    return res.status(200).json({ ok: true, fan_id: fanId, gas_level: gasLevel, motor_state: motorState });
  } catch (err) {
    // Log error but don't expose details to webhook caller
    console.error('Webhook error:', err);
    return res.status(500).json({ ok: false, message: 'Internal server error' });
  }
});

export default router;

