export declare class CreateGameDto {
    whitePlayerId: string;
    blackPlayerId?: string;
    mode?: 'PVP' | 'BOT';
    botDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    timeControlSeconds?: number;
}
