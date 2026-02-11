import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import sensor from './routes/sensor.routes.js';
import gateway from './routes/gateway.routes.js'
import environmentalData from './routes/environmentalData.routes.js';
import reportRoutes from './routes/report.routes.js';
import userRoutes from './routes/user.routes.js';
import contentRoutes from './routes/content.routes.js';
import { initDB } from './config/database.js';
import imageData from './routes/imageData.routes.js';
import countsData from './routes/countsData.routes.js';
import dashboardData from './routes/dashboardData.routes.js'
import data from './routes/data.routes.js'
import pool from './config/database.js';

dotenv.config();

const app = express();
const MAX_PAYLOAD_SIZE = '50mb';

// Resolve paths for static hosting
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  await initDB(); // Run schema.sql on startup
})();


// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: [
          "'self'",
          "data:",
          "https://*.tile.openstreetmap.org",
          "https://images.unsplash.com"
        ],
        connectSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 20 * 1000, // 15 minutes
  max: 1000 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://trapiq.co.tz']
    : ['http://localhost:5173', 'http://192.168.137.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));


// Body parsing middleware
app.use(express.json({ limit: MAX_PAYLOAD_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_PAYLOAD_SIZE }));

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    const conn = await pool.getConnection(); // get a DB connection
    await conn.query('SELECT 1');        // test query
    conn.release?.();                     // release if using pool
    res.json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      database: 'not connected',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensor);
app.use('/api/gateways', gateway)
app.use('/api/fruitfly', environmentalData);
app.use('/api/fruitfly', data);
app.use('/api/fruitfly', imageData);
app.use('/api/fruitfly', countsData);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', dashboardData);
app.use('/api/content', contentRoutes);

// Serve frontend build (Vite)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// SPA fallback for client-side routes (exclude /api)
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// app.listen(() => {
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
