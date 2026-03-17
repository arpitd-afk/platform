import { Socket } from 'socket.io';
import { User } from './models';

export interface AuthenticatedSocket extends Socket {
  user?: Partial<User>;
  gameId?: string;
  classroomId?: string;
}

export interface GameState {
  whiteId: string;
  blackId: string;
  fen: string;
  pgn: string;
  status: 'waiting' | 'active' | 'completed';
  timeControl: string;
  whiteTimeMs: number;
  blackTimeMs: number;
  incrementMs: number;
  moves: any[];
  result?: any;
}
