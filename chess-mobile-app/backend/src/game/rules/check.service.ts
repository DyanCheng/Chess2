import { Injectable } from '@nestjs/common';
import { isKingInCheckOnBoard } from '../../bot/chess-engine/move-generator';

@Injectable()
export class CheckService {
  isKingInCheck(board: any[][], color: 'w' | 'b'): boolean {
    return isKingInCheckOnBoard(board, color);
  }
}