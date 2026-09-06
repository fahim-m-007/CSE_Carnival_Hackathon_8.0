import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, getConnectionStatus } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import scriptRoutes from './routes/scriptRoutes.js';
import rubricRoutes from './routes/rubricRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Health & Diagnostic Route
app.get('/api/health', (req, res) => {
  const dbStatus = getConnectionStatus();
  res.json({
    status: 'online',
    app: 'GradeCalibrate Backend API',
    institution: 'Ahsanullah University of Science and Technology (AUST)',
    database: {
      provider: 'MongoDB Atlas',
      ...dbStatus
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/rubric', rubricRoutes);
app.use('/api/assessment', assessmentRoutes);

// Root fallback
app.get('/', (req, res) => {
  res.json({
    message: 'GradeCalibrate Backend API is running.',
    health: '/api/health',
    endpoints: [
      '/api/auth',
      '/api/courses',
      '/api/scripts',
      '/api/rubric',
      '/api/assessment'
    ]
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server & Connect Database
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(`🚀 GradeCalibrate Server running at http://localhost:${PORT}`);
    console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📚 Courses API: http://localhost:${PORT}/api/courses`);
    console.log(`========================================================\n`);
  });
}

startServer();

export default app;
