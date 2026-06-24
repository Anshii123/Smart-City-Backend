import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/config.js';
import connectDB from './config/db.js';
import requestLogger from './middleware/requestLogger.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { startModelServer } from './services/mlService.js';
import { loadCityDataCache } from './services/cityDataService.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use(requestLogger);

// API Routes
app.use('/api', apiRouter);

// Root path response for usability
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Smart City Climate Platform API',
    endpoints: {
      health: '/api/health',
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        me: '/api/auth/me'
      },
      uploads: '/api/uploads',
      climate: {
        analyze: '/api/climate/analyze'
      }
    }
  });
});

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection and service initialization
// For Vercel, we initialize on first request
let dbConnected = false;
let mlServerStarted = false;

const initializeServices = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log('✅ Database connected successfully');

      // Start ML services after DB connection
      if (!mlServerStarted) {
        startModelServer();
        loadCityDataCache();
        mlServerStarted = true;
        console.log('✅ ML services started');
      }
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
    }
  }
};

// Middleware to ensure services are initialized on request
app.use(async (req, res, next) => {
  // Skip for health checks to avoid unnecessary initialization
  if (req.path === '/api/health' || req.path === '/') {
    return next();
  }

  // Initialize services if needed (non-blocking for Vercel)
  if (!dbConnected) {
    await initializeServices();
  }
  next();
});

// Export the app for Vercel
export default app;

// Start server only when running locally (not on Vercel)
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

if (!isVercel) {
  const PORT = config.port || 3000;
  const HOST = '127.0.0.1';

  // Initialize services before starting server locally
  await initializeServices();

  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running in ${config.env} mode on http://${HOST}:${PORT}`);
  });

  // Gracefully handle port already in use
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   Run: Get-Process node | Stop-Process -Force`);
      console.error(`   Then restart the server.\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
}