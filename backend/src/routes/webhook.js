import { Router } from 'express';
import { getDbPool } from '../services/db.js';

const router = Router();

// Arduino Cloud Webhook Handler
router.post('/arduino', async (req, res, next) => {
  try {
    const payload = req.body;
    
    // Validate payload structure
    if (!payload || !payload.values || !Array.isArray(payload.values)) {
      return res.status(400).json({ success: false, message: 'Invalid payload structure' });
    }

    const deviceId = payload.device_id;
    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'device_id is required' });
    }

    const pool = await getDbPool();
    
    // Find fan by device_id
    const [fans] = await pool.query('SELECT id FROM fans WHERE device_id = ?', [deviceId]);
    
    if (fans.length === 0) {
      return res.status(404).json({ success: false, message: 'Fan not found for device_id' });
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

    if (gasLevel === null) {
      return res.status(400).json({ success: false, message: 'gasLevel value is required' });
    }

    // Update fan_readings table
    await pool.query(
      'INSERT INTO fan_readings (fan_id, gas_level, motor_state, timestamp) VALUES (?, ?, ?, NOW())',
      [fanId, gasLevel, motorState ? 1 : 0]
    );

    // Get current fan state to calculate runtime
    const [fanData] = await pool.query(
      'SELECT status, last_on_at FROM fans WHERE id = ?',
      [fanId]
    );
    const currentStatus = fanData[0]?.status || 'OFF';
    const lastOnAt = fanData[0]?.last_on_at;

    let runtimeMinutes = 0;

    // Update fan status and calculate runtime
    if (motorState) {
      // Motor turning ON
      if (currentStatus !== 'ON') {
        // Fan was OFF, now turning ON - set last_on_at
        await pool.query(
          "UPDATE fans SET status='ON', last_on_at=NOW() WHERE id = ?",
          [fanId]
        );
      }
      // Motor is ON, no runtime change yet
    } else {
      // Motor turning OFF
      if (currentStatus === 'ON' && lastOnAt) {
        // Calculate runtime since last_on_at
        const [runtimeResult] = await pool.query(
          `SELECT TIMESTAMPDIFF(MINUTE, ?, NOW()) as minutes`,
          [lastOnAt]
        );
        runtimeMinutes = runtimeResult[0]?.minutes || 0;

        // Update fan runtime
        await pool.query(`
          UPDATE fans SET 
            runtime_hours = runtime_hours + ?,
            runtime_today = runtime_today + IF(DATE(?) = CURDATE(), ?, 0),
            status='OFF',
            last_on_at=NULL
          WHERE id = ?
        `, [runtimeMinutes / 60, lastOnAt, runtimeMinutes / 60, fanId]);
      } else {
        // Fan was already OFF
        await pool.query("UPDATE fans SET status='OFF' WHERE id = ?", [fanId]);
      }
    }

    // Append to fan_runtime_log table
    await pool.query(
      'INSERT INTO fan_runtime_log (fan_id, gas_level, motor_state, runtime_minutes, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [fanId, gasLevel, motorState ? 1 : 0, runtimeMinutes]
    );

    return res.status(200).json({ 
      success: true, 
      fan_id: fanId, 
      gas_level: gasLevel, 
      motor_state: motorState,
      runtime_minutes: runtimeMinutes
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

