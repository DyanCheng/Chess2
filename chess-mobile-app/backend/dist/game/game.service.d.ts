import { SupabaseService } from '../database/supabase.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';
export declare class GameService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    createGame(createGameDto: CreateGameDto): Promise<any>;
    getGame(gameId: string): Promise<any>;
    makeMove(moveDto: MoveDto): Promise<{
        success: boolean;
        newFen: string;
    }>;
    handleMatchResult(gameId: string, winnerId: string | null, resultReason: string): Promise<{
        message: string;
    }>;
}
