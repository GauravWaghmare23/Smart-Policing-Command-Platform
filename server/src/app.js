import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { checkRedisAvailable } from './config/redis.js';
import { checkRabbitAvailable } from './config/rabbitmq.js';

// Middlewares
import { errorMiddleware } from './middleware/error.middleware.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';

// Routes imports
import authRoutes from './routes/auth.routes.js';
import stationRoutes from './routes/station.routes.js';
import officerRoutes from './routes/officer.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import firRoutes from './routes/fir.routes.js';
import sosRoutes from './routes/sos.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import reportRoutes from './routes/report.routes.js';
import crimeRoutes from './routes/crime.routes.js';
import patrolRoutes from './routes/patrol.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import suspectRoutes from './routes/suspect.routes.js';
import caseDossierRoutes from './routes/caseDossier.routes.js';
import aiAssistantRoutes from './routes/aiAssistant.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting (600 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.'
  }
});
app.use('/api', limiter);

// Standard middlewares
app.use(
  cors({
    origin: [env.clientUrl, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Serve uploads static folder
app.use('/uploads', express.static('uploads'));

// Health Check API
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  
  res.status(200).json({
    success: true,
    message: 'Smart Police backend is healthy',
    data: {
      status: 'UP',
      database: dbStatus,
      redis: checkRedisAvailable() ? 'connected' : 'in-memory fallback',
      rabbitmq: checkRabbitAvailable() ? 'connected' : 'synchronous fallback',
      timestamp: new Date(),
      uptime: process.uptime()
    }
  });
});

// Register routers
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/firs', firRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/crime', crimeRoutes);
app.use('/api/patrols', patrolRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/suspects', suspectRoutes);
app.use('/api/cases', caseDossierRoutes);
app.use('/api/ai', aiAssistantRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Error handlers
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
