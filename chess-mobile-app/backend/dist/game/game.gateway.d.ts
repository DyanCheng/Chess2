import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService, BoardPosition } from './game.service';
export declare class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly gameService;
    server: Server;
    constructor(gameService: GameService);
    handleConnection(_client: Socket): void;
    handleDisconnect(_client: Socket): void;
    handleFindMatch(client: Socket, payload: {
        playerId: string;
    }): import("./game.service").ActiveGameSession;
    handleMakeMoveEvent(_client: Socket, payload: {
        playerId: string;
        gameId: string;
        from: BoardPosition;
        to: BoardPosition;
        promotion?: 'q' | 'r' | 'b' | 'n';
    }): {
        success: boolean;
        game?: import("./game.service").ActiveGameSession;
        error?: string;
    };
    handleStandardMove(_client: Socket, payload: {
        playerId: string;
        gameId: string;
        from: BoardPosition;
        to: BoardPosition;
        promotion?: 'q' | 'r' | 'b' | 'n';
    }): {
        success: boolean;
        game?: import("./game.service").ActiveGameSession;
        error?: string;
    };
    handleJoinGame(client: Socket, payload: {
        gameId: string;
        playerId: string;
    }): {
        success: boolean;
        data: import("./game.service").ActiveGameSession;
    };
    handleResign(_client: Socket, payload: {
        gameId: string;
        playerId: string;
    }): {
        success: boolean;
        data: import("./game.service").ActiveGameSession;
    };
    handleSyncState(client: Socket, payload: {
        gameId: string;
    }): {
        success: boolean;
        data: import("./game.service").ActiveGameSession;
    };
}
