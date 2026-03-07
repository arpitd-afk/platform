require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initSocketHandlers } = require('./websocket/socketHandlers');
const logger = require('./utils/logger');

const authRoutes       = require('./routes/auth');
const userRoutes       = require('./routes/users');
const academyRoutes    = require('./routes/academies');
const batchRoutes      = require('./routes/batches');
const classroomRoutes  = require('./routes/classrooms');
const gameRoutes       = require('./routes/games');
const tournamentRoutes = require('./routes/tournaments');
const assignmentRoutes = require('./routes/assignments');
const analyticsRoutes  = require('./routes/analytics');
const billingRoutes    = require('./routes/billing');
const puzzleRoutes     = require('./routes/puzzles');
const notificationRoutes = require('./routes/notifications');
const contentRoutes    = require('./routes/content');
const anticheatRoutes  = require('./routes/anticheat');
const { router: activityLogRoutes } = require('./routes/activityLogs');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter }  = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET','POST'], credentials: true },
  transports: ['websocket','polling'],
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(compression());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', rateLimiter({ points: 10, duration: 60 }));
app.use('/api', rateLimiter({ points: 300, duration: 60 }));
app.use((req, _res, next) => { req.io = io; next(); });

app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/academies',     academyRoutes);
app.use('/api/batches',       batchRoutes);
app.use('/api/classrooms',    classroomRoutes);
app.use('/api/games',         gameRoutes);
app.use('/api/tournaments',   tournamentRoutes);
app.use('/api/assignments',   assignmentRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/billing',       billingRoutes);
app.use('/api/puzzles',       puzzleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/content',       contentRoutes);
app.use('/api/anticheat',     anticheatRoutes);
app.use('/api/activity-logs', activityLogRoutes);
const messagesRoutes = require('./routes/messages');
app.use('/api/messages',     messagesRoutes);

app.get('/health', (req, res) => res.json({ status:'ok', uptime: process.uptime(), timestamp: new Date() }));
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

initSocketHandlers(io);

const PORT = process.env.PORT || 5000;
async function start() {
  try {
    await connectDB(); logger.info('✅ Database connected');
    await connectRedis(); logger.info('✅ Redis connected');
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
    });
  } catch (error) { logger.error('Failed to start server:', error); process.exit(1); }
}
start();
module.exports = { app, io };
// Extra content routes with lesson progress
try { require('./routes/content').extraRoutes?.(app); } catch(e) {}
