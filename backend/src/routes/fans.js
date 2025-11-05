import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { getDbPool } from '../services/db.js';
import { fetchGasAndMotor, setMotorState } from '../services/arduinoCloud.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pool = await getDbPool();
    const [rows] = await pool.query('SELECT id, name, location, status, runtime_hours, runtime_today, device_id, thing_id, created_at FROM fans WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
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

// Download Full Fan Report
router.get('/report', requireAuth, async (req, res, next) => {
  try {
    const format = req.query.format || 'csv'; // csv or pdf
    const pool = await getDbPool();
    
    // Fetch all fans with latest gas level (from fan_readings or fan_data)
    const [fans] = await pool.query(`
      SELECT 
        f.id,
        f.name,
        f.location,
        f.runtime_today,
        f.runtime_hours as runtime_total,
        f.status,
        f.created_at,
        COALESCE(
          (SELECT gas_level FROM fan_readings WHERE fan_id = f.id ORDER BY timestamp DESC LIMIT 1),
          (SELECT gas_level FROM fan_data WHERE fan_id = f.id ORDER BY timestamp DESC LIMIT 1),
          NULL
        ) as last_gas_level
      FROM fans f
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    if (format === 'csv') {
      // CSV Export
      const headers = ['Fan Name', 'Location', 'Runtime Today (hours)', 'Runtime Total (hours)', 'Last Gas Level', 'Status', 'Created At'];
      const rows = fans.map(f => [
        f.name || '',
        f.location || '',
        (f.runtime_today || 0).toString(),
        (f.runtime_total || 0).toString(),
        (f.last_gas_level || 'N/A').toString(),
        f.status || 'OFF',
        f.created_at ? new Date(f.created_at).toISOString() : ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(c => `"${c.toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fan_report_${Date.now()}.csv"`);
      return res.send(csvContent);
    } else if (format === 'pdf') {
      // PDF Export using pdfkit
      const { default: PDFDocument } = await import('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="fan_report_${Date.now()}.pdf"`);
      
      doc.pipe(res);
      
      doc.fontSize(20).text('Fan Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);
      
      let yPos = 150;
      fans.forEach((fan, index) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
        
        doc.fontSize(14).text(`${index + 1}. ${fan.name}`, 50, yPos);
        yPos += 20;
        doc.fontSize(10).text(`Location: ${fan.location}`, 60, yPos);
        yPos += 15;
        doc.text(`Runtime Today: ${(fan.runtime_today || 0).toFixed(2)} hours`, 60, yPos);
        yPos += 15;
        doc.text(`Runtime Total: ${(fan.runtime_total || 0).toFixed(2)} hours`, 60, yPos);
        yPos += 15;
        doc.text(`Last Gas Level: ${fan.last_gas_level !== null ? fan.last_gas_level : 'N/A'}`, 60, yPos);
        yPos += 15;
        doc.text(`Status: ${fan.status || 'OFF'}`, 60, yPos);
        yPos += 15;
        doc.text(`Created: ${fan.created_at ? new Date(fan.created_at).toLocaleString() : 'N/A'}`, 60, yPos);
        yPos += 25;
      });
      
      doc.end();
    } else {
      return res.status(400).json({ message: 'Invalid format. Use csv or pdf' });
    }
  } catch (err) { next(err); }
});

