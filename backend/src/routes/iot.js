import { Router } from 'express';
import { getDbPool } from '../services/db.js';

const router = Router();

// Arduino IoT Cloud Webhook Handler
router.post('/webhook', async (req, res, next) => {
  const io = req.app.io; // Get socket.io instance from app
  const pool = await getDbPool();
  const connection = await pool.getConnection();
  
  try {
    const payload = req.body;
    
    // Validate payload structure
    if (!payload || typeof payload !== 'object') {
      return res.status(200).json({ success: true, message: 'Invalid payload, ignored' });
    }

    const deviceId = payload.device_id;
    if (!deviceId || typeof deviceId !== 'string') {
      // Return 200 OK for Arduino Cloud - don't fail webhook
      return res.status(200).json({ success: true, message: 'No device_id, ignored' });
    }

    // Validate values array
    if (!payload.values || !Array.isArray(payload.values)) {
      return res.status(200).json({ success: true, message: 'Invalid values array, ignored' });
    }

    // Start transaction
    await connection.beginTransaction();

    // Find fan by device_id
    const [fans] = await connection.query(
      'SELECT id, status, last_on_at FROM fans WHERE device_id = ?',
      [deviceId]
    );
    
    if (fans.length === 0) {
      // Return 200 OK even if device not found (for Arduino Cloud)
      await connection.rollback();
      return res.status(200).json({ success: true, message: 'Device not found, ignored' });
    }

    const fan = fans[0];
    const fanId = fan.id;
    let gasLevel = null;
    let motorState = false;

    // Extract values from payload
    for (const value of payload.values) {
      if (value && typeof value === 'object') {
        if (value.name === 'gasLevel' && value.value !== undefined) {
          gasLevel = parseFloat(value.value);
        }
        if (value.name === 'motorState' || value.name === 'motor_state') {
          motorState = value.value === true || value.value === 'true' || value.value === 1 || value.value === '1';
        }
      }
    }

    if (gasLevel === null || isNaN(gasLevel)) {
      await connection.rollback();
      return res.status(200).json({ success: true, message: 'Invalid gasLevel, ignored' });
    }

    const currentStatus = fan.status || 'OFF';
    const lastOnAt = fan.last_on_at;
    let runtimeMinutes = 0;
    let runtimeHoursToAdd = 0;

    // Calculate runtime if motor is turning OFF
    if (!motorState && currentStatus === 'ON' && lastOnAt) {
      const [runtimeResult] = await connection.query(
        'SELECT TIMESTAMPDIFF(MINUTE, ?, NOW()) as minutes',
        [lastOnAt]
      );
      runtimeMinutes = runtimeResult[0]?.minutes || 0;
      runtimeHoursToAdd = runtimeMinutes / 60;
    }

    // Insert into fan_readings table
    await connection.query(
      'INSERT INTO fan_readings (fan_id, gas_level, motor_state, created_at) VALUES (?, ?, ?, NOW())',
      [fanId, gasLevel, motorState ? 1 : 0]
    );

    // Update fan table
    if (motorState) {
      // Motor turning ON
      if (currentStatus !== 'ON') {
        // Fan was OFF, now turning ON
        await connection.query(
          "UPDATE fans SET status='ON', last_on_at=NOW(), last_updated=NOW() WHERE id = ?",
          [fanId]
        );
      } else {
        // Fan already ON, just update timestamp
        await connection.query(
          "UPDATE fans SET last_updated=NOW() WHERE id = ?",
          [fanId]
        );
      }
    } else {
      // Motor turning OFF
      if (currentStatus === 'ON' && runtimeHoursToAdd > 0) {
        // Calculate runtime and update
        await connection.query(`
          UPDATE fans SET 
            runtime_hours = runtime_hours + ?,
            runtime_total = runtime_total + ?,
            runtime_today = runtime_today + IF(DATE(?) = CURDATE(), ?, 0),
            status='OFF',
            last_on_at=NULL,
            last_updated=NOW()
          WHERE id = ?
        `, [runtimeHoursToAdd, runtimeHoursToAdd, lastOnAt, runtimeHoursToAdd, fanId]);
      } else {
        // Fan was already OFF
        await connection.query(
          "UPDATE fans SET status='OFF', last_updated=NOW() WHERE id = ?",
          [fanId]
        );
      }
    }

    // Append to fan_runtime_log table
    await connection.query(
      'INSERT INTO fan_runtime_log (fan_id, gas_level, motor_state, runtime_minutes, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [fanId, gasLevel, motorState ? 1 : 0, runtimeMinutes]
    );

    // Commit transaction
    await connection.commit();

    // Emit socket event for real-time updates
    if (io) {
      io.emit('fan-update', {
        fan_id: fanId,
        device_id: deviceId,
        gas_level: gasLevel,
        motor_state: motorState,
        status: motorState ? 'ON' : 'OFF',
        last_updated: new Date().toISOString()
      });
    }

    return res.status(200).json({ 
      success: true, 
      fan_id: fanId, 
      gas_level: gasLevel, 
      motor_state: motorState
    });
  } catch (err) {
    // Rollback on error
    await connection.rollback();
    console.error('Webhook error:', err);
    // Return 200 OK even on error to satisfy Arduino Cloud
    return res.status(200).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

export default router;

