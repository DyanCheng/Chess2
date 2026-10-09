import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Chess } from 'chess.js';

interface GameRoom {
  id: string;
  whiteId: string;
  blackId: string;
  chess: Chess;
  whiteHP: number;
  blackHP: number;
  status: 'playing' | 'finished';
}

@Injectable()
export class GameService {
  private matchmakingQueue: { userId: string; socket: Socket }[] = [];
  private activeGames: Map<string, GameRoom> = new Map();
  private userToGameMap: Map<string, string> = new Map();

  addToMatchmaking(userId: string, socket: Socket, server: Server) {
    // Check if already in queue or in game
    if (this.matchmakingQueue.find(p => p.userId === userId)) return;
    if (this.userToGameMap.has(userId)) return;

    this.matchmakingQueue.push({ userId, socket });
    console.log(`User ${userId} joined matchmaking. Queue size: ${this.matchmakingQueue.length}`);

    this.tryMatchmaking(server);
  }

  removeFromMatchmaking(userId: string) {
    this.matchmakingQueue = this.matchmakingQueue.filter(p => p.userId !== userId);
  }

  private tryMatchmaking(server: Server) {
    if (this.matchmakingQueue.length >= 2) {
      const p1 = this.matchmakingQueue.shift();
      const p2 = this.matchmakingQueue.shift();

      const gameId = `game_${Date.now()}`;
      
      const game: GameRoom = {
        id: gameId,
        whiteId: p1.userId,
        blackId: p2.userId,
        chess: new Chess(),
        whiteHP: 40,
        blackHP: 40,
        status: 'playing'
      };

      this.activeGames.set(gameId, game);
      this.userToGameMap.set(p1.userId, gameId);
      this.userToGameMap.set(p2.userId, gameId);

      p1.socket.join(gameId);
      p2.socket.join(gameId);

      server.to(gameId).emit('match_found', {
        gameId,
        whiteId: p1.userId,
        blackId: p2.userId,
        fen: game.chess.fen()
      });

      console.log(`Game started: ${gameId}`);
    }
  }

  handleMove(userId: string, gameId: string, from: any, to: any, server: Server) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'playing') return;

    // Convert algebraic notation (e.g., from frontend to chess.js format)
    const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const fromSquare = `${columns[from.col]}${8 - from.row}`;
    const toSquare = `${columns[to.col]}${8 - to.row}`;

    // Validate turn
    const isWhiteTurn = game.chess.turn() === 'w';
    if ((isWhiteTurn && userId !== game.whiteId) || (!isWhiteTurn && userId !== game.blackId)) {
      return; // Not their turn
    }

    try {
      // Validate and execute move via chess.js
      const move = game.chess.move({
        from: fromSquare,
        to: toSquare,
        promotion: 'q' // Auto queen for MVP
      });

      if (move) {
        // Calculate HP damage if capture
        if (move.captured) {
          const damageMap = { p: 2, n: 6, b: 6, r: 10, q: 18 };
          const damage = damageMap[move.captured] || 0;
          
          if (isWhiteTurn) {
            game.blackHP -= damage;
          } else {
            game.whiteHP -= damage;
          }
        }

        // Broadcast valid move
        server.to(gameId).emit('move_made', {
          from,
          to,
          fen: game.chess.fen(),
          whiteHP: game.whiteHP,
          blackHP: game.blackHP
        });

        this.checkGameEnd(game, server);
      }
    } catch (error) {
      // Invalid move (chess.js throws or returns null)
      console.log('Invalid move attempted');
    }
  }

  handleCardUse(userId: string, gameId: string, cardId: string, target: any, server: Server) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'playing') return;

    // TODO: Implement actual card logic
    console.log(`User ${userId} used card ${cardId} in game ${gameId}`);
    
    server.to(gameId).emit('card_used', {
      userId,
      cardId,
      target
    });
  }

  handleResign(userId: string, gameId: string, server: Server) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'playing') return;

    game.status = 'finished';
    const winnerId = userId === game.whiteId ? game.blackId : game.whiteId;

    server.to(gameId).emit('game_over', {
      winnerId,
      reason: 'resign'
    });

    this.cleanupGame(gameId);
  }

  handleDisconnect(userId: string, server: Server) {
    this.removeFromMatchmaking(userId);
    
    const gameId = this.userToGameMap.get(userId);
    if (gameId) {
      this.handleResign(userId, gameId, server);
    }
  }

  private checkGameEnd(game: GameRoom, server: Server) {
    let winnerId = null;
    let reason = '';

    if (game.chess.isCheckmate()) {
      winnerId = game.chess.turn() === 'w' ? game.blackId : game.whiteId;
      reason = 'checkmate';
    } else if (game.whiteHP <= 0) {
      winnerId = game.blackId;
      reason = 'hp_depleted';
    } else if (game.blackHP <= 0) {
      winnerId = game.whiteId;
      reason = 'hp_depleted';
    } else if (game.chess.isStalemate() || game.chess.isDraw()) {
      reason = 'draw';
    }

    if (reason) {
      game.status = 'finished';
      server.to(game.id).emit('game_over', {
        winnerId,
        reason
      });
      this.cleanupGame(game.id);
    }
  }

  private cleanupGame(gameId: string) {
    const game = this.activeGames.get(gameId);
    if (game) {
      this.userToGameMap.delete(game.whiteId);
      this.userToGameMap.delete(game.blackId);
      this.activeGames.delete(gameId);
    }
  }
}
