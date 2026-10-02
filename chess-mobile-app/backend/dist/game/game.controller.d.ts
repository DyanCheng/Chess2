import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';
export declare class GameController {
    private readonly gameService;
    constructor(gameService: GameService);
    createMatch(createGameDto: CreateGameDto): Promise<any>;
    getMatch(id: string): Promise<any>;
    makeMove(moveDto: MoveDto): Promise<{
        success: boolean;
        newFen: string;
    }>;
}
