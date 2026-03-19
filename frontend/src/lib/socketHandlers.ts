import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { Chess } from "chess.js";
import { redisSession } from "../lib/redis";
import logger from "../lib/logger";
import config from "../lib/config";
import { AuthenticatedSocket, GameState } from "../types/socket";

const JWT_SECRET = config.jwtSecret;

const activeGames = new Map<string, any>();
const activeClassrooms = new Map<string, Set<string>>();

export function initSocketHandlers(io: Server) {
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      socket.user = decoded.user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.user?.id;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    if (userId) {
      socket.join(`user:${userId}`);
      redisSession.setUserOnline(userId, socket.id).catch(() => {});
    }

    // --- GAME EVENTS ---
    socket.on("game:join", async ({ gameId }) => {
      try {
        const gameState = await redisSession.getGameState(gameId);
        if (!gameState) {
          socket.emit("error", { message: "Game not found" });
          return;
        }

        socket.join(`game:${gameId}`);
        socket.gameId = gameId;

        if (!activeGames.has(gameId)) {
          activeGames.set(gameId, {
            white: null,
            black: null,
            spectators: new Set(),
          });
        }

        const room = activeGames.get(gameId);
        if (gameState.whiteId === userId) room.white = socket.id;
        else if (gameState.blackId === userId) room.black = socket.id;
        else room.spectators.add(socket.id);

        if (room.white && room.black && gameState.status === "waiting") {
          gameState.status = "active";
          await redisSession.setGameState(gameId, gameState);
          io.to(`game:${gameId}`).emit("game:start", gameState);
        } else {
          socket.emit("game:state", gameState);
        }
      } catch (err) {
        logger.error("game:join error:", err);
      }
    });

    socket.on("game:move", async ({ gameId, move, timeLeftMs }) => {
      try {
        const gameState = await redisSession.getGameState(gameId);
        if (!gameState || gameState.status !== "active") return;

        const chess = new Chess(gameState.fen);
        const isWhiteTurn = chess.turn() === "w";
        const currentPlayerId = isWhiteTurn
          ? gameState.whiteId
          : gameState.blackId;

        if (userId !== currentPlayerId) {
          socket.emit("error", { message: "Not your turn" });
          return;
        }

        const result = chess.move(move);
        if (!result) {
          socket.emit("game:invalid_move", { move });
          return;
        }

        gameState.fen = chess.fen();
        gameState.pgn = chess.pgn();
        gameState.moves.push({ ...result, timestamp: Date.now() });

        if (isWhiteTurn) {
          gameState.whiteTimeMs =
            (timeLeftMs || gameState.whiteTimeMs) + gameState.incrementMs;
        } else {
          gameState.blackTimeMs =
            (timeLeftMs || gameState.blackTimeMs) + gameState.incrementMs;
        }

        if (chess.isGameOver()) {
          gameState.status = "completed";
          gameState.result = {
            winner: chess.turn() === "w" ? "black" : "white",
            reason: "checkmate",
          };
        }

        await redisSession.setGameState(gameId, gameState);
        io.to(`game:${gameId}`).emit("game:move", {
          move: result,
          fen: gameState.fen,
          whiteTimeMs: gameState.whiteTimeMs,
          blackTimeMs: gameState.blackTimeMs,
          gameOver: gameState.status === "completed" ? gameState.result : null,
        });
      } catch (err) {
        logger.error("game:move error:", err);
      }
    });

    // --- CLASSROOM EVENTS ---
    socket.on("classroom:join", async ({ classroomId }) => {
      socket.join(`classroom:${classroomId}`);
      socket.classroomId = classroomId;

      if (!activeClassrooms.has(classroomId)) {
        activeClassrooms.set(classroomId, new Set());
      }
      activeClassrooms.get(classroomId)!.add(socket.id);

      const boardFen = await redisSession.getClassroomBoard(classroomId);
      if (boardFen) socket.emit("classroom:board_sync", { fen: boardFen });
    });

    socket.on("disconnect", async () => {
      if (userId) await redisSession.setUserOffline(userId);
      if (socket.gameId) {
        const room = activeGames.get(socket.gameId);
        if (room) {
          if (room.white === socket.id) room.white = null;
          if (room.black === socket.id) room.black = null;
        }
      }
    });
  });
}
