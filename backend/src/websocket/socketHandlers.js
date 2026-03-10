const jwt = require('jsonwebtoken');
const { Chess } = require('chess.js');
const { session } = require('../config/redis');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'chess-academy-secret-change-in-production';

// Track active rooms
const activeGames = new Map(); // gameId -> { white: socketId, black: socketId }
const activeClassrooms = new Map(); // classroomId -> Set of socketIds

function initSocketHandlers(io) {
  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded.user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // Join user's personal room for notifications
    if (userId) {
      socket.join(`user:${userId}`);
      session.setUserOnline(userId, socket.id).catch(() => { });
    }

    // ─── GAME EVENTS ──────────────────────────────────────────────────────────

    socket.on('game:join', async ({ gameId }) => {
      try {
        const gameState = await session.getGameState(gameId);
        if (!gameState) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Verify player belongs to game
        const isPlayer = gameState.whiteId === userId || gameState.blackId === userId;
        const isSpectator = !isPlayer;

        socket.join(`game:${gameId}`);
        socket.gameId = gameId;

        if (!activeGames.has(gameId)) {
          activeGames.set(gameId, { white: null, black: null, spectators: new Set() });
        }

        const room = activeGames.get(gameId);
        if (gameState.whiteId === userId) room.white = socket.id;
        else if (gameState.blackId === userId) room.black = socket.id;
        else room.spectators.add(socket.id);

        // If both players connected, start the game
        if (room.white && room.black && gameState.status === 'waiting') {
          gameState.status = 'active';
          await session.setGameState(gameId, gameState);
          io.to(`game:${gameId}`).emit('game:start', {
            fen: gameState.fen,
            whiteId: gameState.whiteId,
            blackId: gameState.blackId,
            timeControl: gameState.timeControl,
            whiteTimeMs: gameState.whiteTimeMs,
            blackTimeMs: gameState.blackTimeMs,
          });
        } else {
          // Send current state to joining player
          socket.emit('game:state', gameState);
        }
      } catch (err) {
        logger.error('game:join error:', err);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    socket.on('game:move', async ({ gameId, move, timeLeftMs }) => {
      try {
        const gameState = await session.getGameState(gameId);
        if (!gameState || gameState.status !== 'active') return;

        const chess = new Chess(gameState.fen);
        const isWhiteTurn = chess.turn() === 'w';
        const currentPlayerId = isWhiteTurn ? gameState.whiteId : gameState.blackId;

        if (userId !== currentPlayerId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        const result = chess.move({
          from: move.slice(0, 2),
          to: move.slice(2, 4),
          promotion: move.length === 5 ? move[4] : 'q',
        });

        if (!result) {
          socket.emit('game:invalid_move', { move });
          return;
        }

        const moveData = {
          san: result.san,
          uci: move,
          fen: chess.fen(),
          captured: result.captured,
          flags: result.flags,
          timestamp: Date.now(),
        };

        gameState.moves.push(moveData);
        gameState.fen = chess.fen();
        gameState.pgn = chess.pgn();

        if (isWhiteTurn) {
          gameState.whiteTimeMs = (timeLeftMs || gameState.whiteTimeMs) + gameState.incrementMs;
        } else {
          gameState.blackTimeMs = (timeLeftMs || gameState.blackTimeMs) + gameState.incrementMs;
        }

        let gameOver = null;
        if (chess.isGameOver()) {
          gameState.status = 'completed';
          const winner = chess.isCheckmate() ? (chess.turn() === 'w' ? 'black' : 'white') : null;
          gameOver = {
            winner,
            reason: chess.isCheckmate() ? 'checkmate' :
              chess.isStalemate() ? 'stalemate' :
                chess.isDraw() ? 'draw' : 'unknown',
          };
          gameState.result = gameOver;
        }

        await session.setGameState(gameId, gameState);

        // Broadcast to all in game room
        io.to(`game:${gameId}`).emit('game:move', {
          move: moveData,
          fen: chess.fen(),
          whiteTimeMs: gameState.whiteTimeMs,
          blackTimeMs: gameState.blackTimeMs,
          inCheck: chess.inCheck(),
          gameOver,
        });
      } catch (err) {
        logger.error('game:move socket error:', err);
      }
    });

    socket.on('game:offer_draw', ({ gameId }) => {
      socket.to(`game:${gameId}`).emit('game:draw_offer', { from: userId });
    });

    socket.on('game:accept_draw', async ({ gameId }) => {
      const gameState = await session.getGameState(gameId);
      if (gameState) {
        gameState.status = 'completed';
        gameState.result = { winner: null, reason: 'draw_agreement' };
        await session.setGameState(gameId, gameState);
        io.to(`game:${gameId}`).emit('game:over', { winner: null, reason: 'draw_agreement' });
      }
    });

    socket.on('game:resign', async ({ gameId }) => {
      const gameState = await session.getGameState(gameId);
      if (gameState) {
        const isWhite = userId === gameState.whiteId;
        const winner = isWhite ? 'black' : 'white';
        gameState.status = 'completed';
        gameState.result = { winner, reason: 'resignation' };
        await session.setGameState(gameId, gameState);
        io.to(`game:${gameId}`).emit('game:over', { winner, reason: 'resignation' });
      }
    });

    socket.on('game:timeout', async ({ gameId, color }) => {
      const gameState = await session.getGameState(gameId);
      if (gameState && gameState.status === 'active') {
        const winner = color === 'white' ? 'black' : 'white';
        gameState.status = 'completed';
        gameState.result = { winner, reason: 'timeout' };
        await session.setGameState(gameId, gameState);
        io.to(`game:${gameId}`).emit('game:over', { winner, reason: 'timeout' });
      }
    });

    // ─── CLASSROOM EVENTS ─────────────────────────────────────────────────────

    socket.on('classroom:join', async ({ classroomId }) => {
      socket.join(`classroom:${classroomId}`);
      socket.classroomId = classroomId;

      if (!activeClassrooms.has(classroomId)) {
        activeClassrooms.set(classroomId, new Set());
      }
      activeClassrooms.get(classroomId).add(socket.id);

      // Send current board state
      const boardFen = await session.getClassroomBoard(classroomId);
      if (boardFen) {
        socket.emit('classroom:board_sync', { fen: boardFen });
      }

      // Notify others
      const count = activeClassrooms.get(classroomId).size;
      socket.to(`classroom:${classroomId}`).emit('classroom:user_joined', {
        userId,
        name: socket.user.name,
        count,
      });
    });

    socket.on('classroom:board_update', async ({ classroomId, fen, pgn, move }) => {
      // Only coaches/admins can update board
      if (!['coach', 'academy_admin', 'super_admin'].includes(socket.user.role)) {
        socket.emit('error', { message: 'Not authorized to update board' });
        return;
      }
      await session.setClassroomBoard(classroomId, fen);
      socket.to(`classroom:${classroomId}`).emit('classroom:board_update', { fen, pgn, move });
    });

    socket.on('classroom:annotation', ({ classroomId, annotation }) => {
      if (!['coach', 'academy_admin'].includes(socket.user.role)) return;
      socket.to(`classroom:${classroomId}`).emit('classroom:annotation', annotation);
    });

    socket.on('classroom:clear_annotations', ({ classroomId }) => {
      if (!['coach', 'academy_admin'].includes(socket.user.role)) return;
      socket.to(`classroom:${classroomId}`).emit('classroom:clear_annotations');
    });

    socket.on('classroom:chat', ({ classroomId, message }) => {
      const chatMsg = {
        id: Date.now(),
        userId,
        userName: socket.user.name,
        role: socket.user.role,
        message: message.slice(0, 500),
        timestamp: new Date().toISOString(),
      };
      io.to(`classroom:${classroomId}`).emit('classroom:chat', chatMsg);
    });

    socket.on('classroom:raise_hand', ({ classroomId }) => {
      socket.to(`classroom:${classroomId}`).emit('classroom:hand_raised', {
        userId,
        name: socket.user.name,
      });
    });

    socket.on('classroom:lower_hand', ({ classroomId }) => {
      socket.to(`classroom:${classroomId}`).emit('classroom:hand_lowered', { userId });
    });

    // ─── TOURNAMENT EVENTS ────────────────────────────────────────────────────

    socket.on('tournament:join', ({ tournamentId }) => {
      socket.join(`tournament:${tournamentId}`);
    });

    socket.on('tournament:leave', ({ tournamentId }) => {
      socket.leave(`tournament:${tournamentId}`);
    });

    // ─── NOTIFICATIONS ────────────────────────────────────────────────────────

    socket.on('notification:mark_read', ({ notificationId }) => {
      // Could update DB here
      socket.emit('notification:updated', { notificationId, read: true });
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────


    // ── Direct message typing indicator ───────────────────────────────────────
    socket.on('dm:typing', ({ toUserId, isTyping }) => {
      socket.to(`user:${toUserId}`).emit('dm:typing', { fromUserId: userId, isTyping });
    });


    // ── Batch group chat rooms ────────────────────────────────────────────────
    socket.on('batch:join', async ({ batchId }) => {
      if (!batchId) return;
      // Verify access
      try {
        const { query } = require('../config/database');
        const access = await query(
          `SELECT 1 FROM batches b
           LEFT JOIN batch_enrollments be ON be.batch_id = b.id AND be.student_id = $1
           WHERE b.id = $2 AND (b.coach_id = $1 OR be.student_id = $1)
           LIMIT 1`,
          [userId, batchId]
        );
        if (access.rows.length || ['academy_admin', 'super_admin'].includes(socket.user?.role)) {
          socket.join(`batch:${batchId}`);
        }
      } catch (e) { logger.error('batch:join error', e.message); }
    });

    socket.on('batch:leave', ({ batchId }) => {
      if (batchId) socket.leave(`batch:${batchId}`);
    });

    // ── Online presence broadcast ──────────────────────────────────────────────
    socket.broadcast.emit('user:online', { userId });

    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (user: ${userId}, reason: ${reason})`);

      if (userId) {
        await session.setUserOffline(userId).catch(() => { });
      }

      // Handle game disconnect
      if (socket.gameId) {
        const room = activeGames.get(socket.gameId);
        if (room) {
          if (room.white === socket.id) room.white = null;
          if (room.black === socket.id) room.black = null;
          room.spectators.delete(socket.id);
          socket.to(`game:${socket.gameId}`).emit('game:opponent_disconnected', { userId });
        }
      }

      // Handle classroom disconnect
      if (socket.classroomId) {
        const room = activeClassrooms.get(socket.classroomId);
        if (room) {
          room.delete(socket.id);
          socket.to(`classroom:${socket.classroomId}`).emit('classroom:user_left', {
            userId,
            count: room.size,
          });
        }
      }
    });
  });

  logger.info('WebSocket handlers initialized');
}

module.exports = { initSocketHandlers };