import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { getDbPool } from '../services/db.js';

const router = Router();

// GET /api/fans - List all user's fans with latest gas_level and last_updated
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const pool = await getDbPool();
    const [rows] = await pool.query(`
      SELECT 
        f.id,
        f.name,
        f.location,
        f.status,
        f.runtime_total,
        f.runtime_today,
        f.device_id,
        f.thing_id,
        f.created_at,
        f.last_updated,
        f.last_gas_level
      FROM fans f
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [req.user.id]);
    return res.json({ fans: rows });
  } catch (err) { next(err); }
});

// POST /api/fans - Create new fan (validate unique device_id per user)
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
    
    // Check if device_id already exists for this user
    const [existing] = await pool.query(
      'SELECT id FROM fans WHERE user_id = ? AND device_id = ?',
      [req.user.id, device_id]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        message: 'A fan with this device_id already exists for your account' 
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO fans (user_id, name, location, device_id, thing_id, status, runtime_today, runtime_total, created_at, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [req.user.id, name, location, device_id, thing_id || null, 'OFF', 0, 0]
    );
    
    return res.status(201).json({ 
      id: result.insertId, 
      name, 
      location, 
      device_id, 
      thing_id, 
      status: 'OFF', 
      runtime_today: 0,
      runtime_total: 0,
      created_at: new Date(),
      last_updated: new Date(),
      last_gas_level: null
    });
  } catch (err) { 
    // Handle unique constraint violation
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A fan with this device_id already exists' });
    }
    next(err); 
  }
});

export default router;

// GET /api/fans/report - Generate CSV or PDF reports
router.get('/report', requireAuth, async (req, res, next) => {
  try {
    const format = req.query.format || 'csv'; // csv or pdf
    const days = Math.max(1, Math.min(Number(req.query.days) || 30, 365)); // Default 30 days, max 365
    const pool = await getDbPool();
    
    // Fetch all fans with latest gas level from fan_readings
    const [fans] = await pool.query(`
      SELECT 
        f.id,
        f.name,
        f.location,
        f.runtime_today,
        f.runtime_total,
        f.status,
        f.created_at,
        f.last_updated,
        f.last_gas_level
      FROM fans f
      WHERE f.user_id = ? 
        AND (f.last_updated IS NULL OR f.last_updated >= DATE_SUB(NOW(), INTERVAL ? DAY))
      ORDER BY f.created_at DESC
    `, [req.user.id, days]);

    if (format === 'csv') {
      // CSV Export using json2csv
      const { Parser } = await import('json2csv');
      const fields = [
        { label: 'Fan Name', value: 'name' },
        { label: 'Location', value: 'location' },
        { label: 'Runtime Today (hours)', value: 'runtime_today' },
        { label: 'Runtime Total (hours)', value: 'runtime_total' },
        { label: 'Last Gas Level', value: (row) => row.last_gas_level || 'N/A' },
        { label: 'Status', value: 'status' },
        { label: 'Created At', value: (row) => row.created_at ? new Date(row.created_at).toISOString() : '' },
        { label: 'Last Updated', value: (row) => row.last_updated ? new Date(row.last_updated).toISOString() : 'N/A' }
      ];
      
      const parser = new Parser({ fields });
      const csv = parser.parse(fans);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="fan_report_${Date.now()}.csv"`);
      return res.send(csv);
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
        yPos += 15;
        doc.text(`Last Updated: ${fan.last_updated ? new Date(fan.last_updated).toLocaleString() : 'N/A'}`, 60, yPos);
        yPos += 25;
      });
      
      doc.end();
    } else {
      return res.status(400).json({ message: 'Invalid format. Use csv or pdf' });
    }
  } catch (err) { next(err); }
});

export default router;

