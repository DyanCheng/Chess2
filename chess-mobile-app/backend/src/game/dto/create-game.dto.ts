export class CreateGameDto {
  gameId?: string;
  whitePlayerId: string;
  blackPlayerId: string;
  
  // Thêm 2 dòng này:
  initialTimeMs?: number; 
  reconnectTimeoutMs?: number;
}