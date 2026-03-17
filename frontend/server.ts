import 'dotenv/config';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import express from 'express';
import { Server } from 'socket.io';
import { connectDB } from './src/lib/db';
import { connectRedis } from './src/lib/redis';
import { initSocketHandlers } from './src/lib/socketHandlers';
import logger from './src/lib/logger';
import config from './src/lib/config';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = config.port || 3000;

app.prepare().then(async () => {
  const server = express();
  const httpServer = createServer(server);

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
    transports: ['websocket', 'polling'],
  });

  (global as any).io = io;

  // Services Initialization
  try {
    await connectDB();
    logger.info('✅ Database connected');
    await connectRedis();
    logger.info('✅ Redis connected');
  } catch (error) {
    logger.error('Failed to connect to services:', error);
  }

  // Socket Handlers
  initSocketHandlers(io);

  // Next.js handler
  server.all('*', (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  httpServer.listen(port, () => {
    logger.info(`🚀 Next.js + Socket.io Server running on http://localhost:${port}`);
  });
});
