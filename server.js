const express = require('express');
const mongoose = require('mongoose'); // ← ADD THIS
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).json({
      status: 'ok',
      message: '🟢 Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db: '🟢 MongoDB connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '🔴 Server is unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db: '🔴 MongoDB disconnected',
    });
  }
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api', require('./routes/ticketRoutes'));
app.use('/api', require('./routes/commentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/', (req, res) => {
  res.json({ message: '🐛 Bug Tracker API is running...' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));