import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { MoveDto } from './dto/move.dto';
export declare class GameController {
    private readonly gameService;
    constructor(gameService: GameService);
    createGame(dto: CreateGameDto): import("./game.service").ActiveGameSession;
    getGame(id: string): import("./game.service").ActiveGameSession;
    makeMove(dto: MoveDto): import("./game.service").ActiveGameSession;
}
