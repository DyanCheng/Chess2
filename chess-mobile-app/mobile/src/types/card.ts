// ============================================================
// Card (Thẻ bài) Type Definitions
// ============================================================

import { PieceColor, PieceType } from './chess';

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type CardEffectType =
  | 'shield'        // Tạo khiên bảo vệ HP
  | 'heal'          // Hồi HP
  | 'double_damage' // Nhân đôi sát thương
  | 'freeze'        // Đóng băng quân cờ đối thủ
  | 'resurrect'     // Hồi sinh quân cờ đã mất
  | 'swap'          // Đổi vị trí 2 quân cờ
  | 'reveal'        // Hiện nước đi tiếp theo của đối thủ
  | 'time_bonus'    // Thêm thời gian
  | 'extra_move'
  | 'poison'        // Gây sát thương theo thời gian
  | 'mirror'        // Phản chiếu sát thương
  | 'teleport'      // Di chuyển quân cờ đến vị trí bất kỳ
  | 'fortify'       // Tăng cường phòng thủ
  | 'pawn_step'
  | 'trump'
  | 'back_to_future'
  | 'high_risk'
  | 'arsenal'
  | 'mu'
  | 'portal'
  | 'start'
  | 'fortune'
  | 'bring_back'
  | 'arsenal_plus'
  | 'hide_king'
  | 'transformer'
  | 'vckbla'
  | 'shuffle'
  | 'greed'
  | 'block'
  | 'nope'
  | 'copy'
  | 'tele'
  | 'mosquito'
  | 'matrix';

export interface Card {
  id: string;
  serverId?: string;
  name: string;
  description: string;
  effectType: CardEffectType;
  rarity: CardRarity;
  manaCost: number;
  iconUrl: string;
  effectAnimation: string;
  duration?: number; // turns the effect lasts
  value?: number;    // healing amount, damage multiplier, etc.
  price: number;
  currencyType: 'gold' | 'gems';
  isOwned: boolean;
  quantity: number;
  maxPerGame: number;
  cooldownTurns: number;
}

export interface CardInHand {
  card: Card;
  instanceId?: string;
  isUsable: boolean;
  cooldownRemaining: number;
  usesRemaining: number;
}

export interface CardEffect {
  id: string;
  cardId: string;
  effectType: CardEffectType;
  targetPlayerId: PieceColor;
  turnsRemaining: number;
  value: number;
  isActive: boolean;
  targetSquare?: string;
  movementTypes?: PieceType[];
}

export interface CardUseAnimation {
  phase: 'before' | 'during' | 'after';
  animationName: string;
  duration: number;
}

export interface CardDeck {
  id: string;
  name: string;
  cards: Card[];
  maxCards: number;
}
