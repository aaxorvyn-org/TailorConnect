import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import { config } from './config/index.js';
import { connectDatabase } from './database/prisma.js';
import { errorHandler } from './common/middleware/error-handler.js';

// Route imports
import { authRouter } from './modules/auth/auth.controller.js';
import { servicesRouter } from './modules/services/services.controller.js';
import { businessesRouter } from './modules/businesses/businesses.controller.js';
import { aiMatchingRouter } from './modules/ai-matching/ai-matching.controller.js';
import { discoveryRouter } from './modules/discovery/discovery.controller.js';
import { requestsRouter } from './modules/requests/requests.controller.js';
import { quotesRouter } from './modules/quotes/quotes.controller.js';
import { ordersRouter } from './modules/orders/orders.controller.js';
import { appointmentsRouter } from './modules/appointments/appointments.controller.js';
import { paymentsRouter } from './modules/payments/payments.controller.js';
import { reviewsRouter } from './modules/reviews/reviews.controller.js';
import { notificationsRouter } from './modules/notifications/notifications.controller.js';
import { adminRouter } from './modules/admin/admin.controller.js';

const app = express();

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Security & Parsing Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(config.uploadDir));

// API Index and Health check endpoints
app.get(['/', '/api/v1'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TailorConnect API',
    version: '1.0.0',
    description: 'Digital Operating System & AI Marketplace for Custom Tailoring & Boutiques',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      services: '/api/v1/services',
      businesses: '/api/v1/businesses',
      discovery: '/api/v1/discovery',
      aiMatching: '/api/v1/ai-matching',
      requests: '/api/v1/requests',
      quotes: '/api/v1/quotes',
      orders: '/api/v1/orders',
      appointments: '/api/v1/appointments',
      payments: '/api/v1/payments',
      reviews: '/api/v1/reviews',
      notifications: '/api/v1/notifications',
      admin: '/api/v1/admin',
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TailorConnect API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/services', servicesRouter);
app.use('/api/v1/businesses', businessesRouter);
app.use('/api/v1/ai-matching', aiMatchingRouter);
app.use('/api/v1/discovery', discoveryRouter);
app.use('/api/v1/requests', requestsRouter);
app.use('/api/v1/quotes', quotesRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/appointments', appointmentsRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/admin', adminRouter);

// Global Error Handler
app.use(errorHandler);

// Bootstrap
async function bootstrap() {
  await connectDatabase();
  app.listen(config.port, () => {
    console.log(`[TailorConnect API] Running on port ${config.port} (${config.nodeEnv})`);
    console.log(`[TailorConnect API] Health Check: http://localhost:${config.port}/api/v1/health`);
  });
}

bootstrap().catch((err) => {
  console.error('[TailorConnect API] Fatal startup error:', err);
  process.exit(1);
});
