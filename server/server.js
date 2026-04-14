require('dotenv').config();
require('express-async-errors');
const express      = require('express');
const path         = require('path');
const cors         = require('cors');
const mongoose     = require('mongoose');
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter, authLimiter, apiLimiter } = require('./middleware/rateLimit');

const authRoutes        = require('./routes/auth');
const medicineRoutes    = require('./routes/medicines');
const salesRoutes       = require('./routes/sales');
const activitiesRoutes  = require('./routes/activities');
const predictionsRoutes = require('./routes/predictions');
const adminRoutes       = require('./routes/admin');

// Connect to DB (non-blocking — server starts even if DB is down)
connectDB();

const app = express();

app.use(cors({ 
  origin: function (origin, callback) {
    // Dynamically allow all origins to eliminate CORS issues on Vercel/Render
    callback(null, origin || true);
  }, 
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// Health check — also shows DB status
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    success: true,
    message: '🚀 RxFlow AI Server is LIVE!',
    database: dbStatus[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth',        authLimiter, authRoutes);
app.use('/api/medicines',   apiLimiter,  medicineRoutes);
app.use('/api/sales',       apiLimiter,  salesRoutes);
app.use('/api/activities',  apiLimiter,  activitiesRoutes);
app.use('/api/predictions', apiLimiter,  predictionsRoutes);
app.use('/api/admin',       apiLimiter,  adminRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
} else {
  // Catch-all for API 404s when not in production
  app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 RxFlow Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => { console.log('Server closed.'); process.exit(0); });
});

module.exports = app;