export declare class MoveDto {
    gameId: string;
    playerId: string;
    from: string | {
        row: number;
        col: number;
    };
    to: string | {
        row: number;
        col: number;
    };
    promotion?: 'q' | 'r' | 'b' | 'n';
}
