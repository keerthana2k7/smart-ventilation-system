import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENV_PATH || undefined });

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { getDbPool, initializeDatabase } from './services/db.js';
import authRouter from './routes/auth.js';
import arduinoRouter from './routes/arduino.js';
import uploadRouter from './routes/upload.js';
import contactRouter from './routes/contact.js';
import { errorHandler } from './utils/errorHandler.js';
import fansRouter from './routes/fans.js';
import analyticsRouter from './routes/analytics.js';
import profileRouter from './routes/profile.js';
import storeRouter from './routes/store.js';
import { fetchGasAndMotor } from './services/arduinoCloud.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/arduino', arduinoRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/contact', contactRouter);
app.use('/api/fans', fansRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/store', storeRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend running on http://localhost:${PORT}`);
    });

    // Start IoT Cloud poller (every 10s)
    const fanId = Number(process.env.ARDUINO_FAN_ID || 1);
    const intervalMs = Number(process.env.IOT_POLL_INTERVAL_MS || 10000);
    setInterval(async () => {
      try {
        const { gasLevel, motorState } = await fetchGasAndMotor();
        const pool = await getDbPool();
        await pool.query('INSERT INTO fan_data (fan_id, gas_level) VALUES (?, ?)', [fanId, gasLevel]);
        if (motorState) {
          await pool.query("UPDATE fans SET status='ON', last_on_at = IF(status='ON', last_on_at, NOW()) WHERE id = ?", [fanId]);
        } else {
          await pool.query(`
            UPDATE fans SET 
              runtime_hours = runtime_hours + IF(status='ON' AND last_on_at IS NOT NULL, TIMESTAMPDIFF(MINUTE, last_on_at, NOW())/60, 0),
              status='OFF', last_on_at=NULL
            WHERE id = ?
          `, [fanId]);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('IoT poller error:', e.message);
      }
    }, intervalMs);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

export default app;

