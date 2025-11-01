import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { prisma } from './config/database';
import { config } from './config/index';
import authRoutes from './routes/auth.routes';
import kycRoutes from './routes/kyc.routes';
import bankingRoutes from './routes/banking.routes';
import twoFactorRoutes from './routes/two-factor.routes';
import termsRoutes from './routes/terms.routes';
import vanityRoutes from './routes/vanity.routes';
import securityRoutes from './routes/security.routes';
import interestRoutes from './routes/interest.routes';
import userRoutes from './routes/user.routes';
import rolesRoutes from './routes/roles.routes';
import userRolesRoutes from './routes/user-roles.routes';
import adminRoutes from './routes/admin.routes';
import tierRoutes from './routes/tier.routes';
import internalRoutes from './routes/internal.routes';
import notificationRoutes from './routes/notification.routes';
import { EmailService } from './services/email.service';
import NotificationWebSocketServer from './services/notification-websocket.service';
import { InterestCronService } from './services/interest-cron.service';

// Load environment variables
dotenv.config();

const app: Application = express();
const server = createServer(app);
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Initialize WebSocket server
const notificationWS = new NotificationWebSocketServer(server);

// Export WebSocket instance for use in routes
import { setNotificationWebSocket } from './services/websocket-instance';
setNotificationWebSocket(notificationWS);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Prisma connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'OK',
      message: 'Banking System API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        prisma: 'Connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'Service Unavailable',
      message: 'Database health check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/terms', termsRoutes);
app.use('/api/vanity', vanityRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/interest', interestRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/user', userRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/users', userRolesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tier', tierRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Banking System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      banking: '/api/banking'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist`
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Initialize email service
EmailService.initialize();

// Test email connection
EmailService.testConnection().then((isReady) => {
  if (isReady) {
    console.log('📧 Email service initialized successfully');
  } else {
    console.log('⚠️  Email service not configured, using fallback mode');
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test Prisma connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Prisma database connected successfully');
    
    // Initialize interest cron jobs
    InterestCronService.initializeCronJobs();
    console.log('🕐 Interest cron jobs initialized');
    
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Banking System API running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket URL: ws://localhost:${PORT}/ws/notifications`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log(`💾 Database: Prisma (SQLite)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 