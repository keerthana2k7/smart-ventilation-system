import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENV_PATH || undefined });

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { getDbPool, initializeDatabase } from './services/db.js';
import authRouter from './routes/auth.js';
import uploadRouter from './routes/upload.js';
import contactRouter from './routes/contact.js';
import { errorHandler } from './utils/errorHandler.js';
import fansRouter from './routes/fans.js';
import analyticsRouter from './routes/analytics.js';
import profileRouter from './routes/profile.js';
import storeRouter from './routes/store.js';
import iotRouter from './routes/iot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach io to app for use in routes
app.io = io;

// Socket connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/contact', contactRouter);
app.use('/api/fans', fansRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/store', storeRouter);
app.use('/api/iot', iotRouter); // Webhook at /api/iot/webhook

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

initializeDatabase()
  .then(() => {
    httpServer.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend running on http://localhost:${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`Socket.IO enabled`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

export default app;
