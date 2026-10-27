import { Injectable } from '@nestjs/common';

export interface PlayerHpState {
  white: number;
  black: number;
}

const CAPTURE_DAMAGE: Record<string, number> = {
  p: 10,
  n: 20,
  b: 20,
  r: 30,
  q: 50,
  k: 100,
};

const CHECK_DAMAGE = 10;

@Injectable()
export class HpService {
  createInitialHp(initialHp = 100): PlayerHpState {
    return {
      white: initialHp,
      black: initialHp,
    };
  }

  /**
   * Tính toán HP mới sau một nước đi
   */
  applyMoveDamage(
    currentHp: PlayerHpState,
    moverColor: 'w' | 'b',
    options?: {
      capturedPiece?: string | null;
      isCheck?: boolean;
      isCheckmate?: boolean;
      customDamage?: number;
    },
  ): { hp: PlayerHpState; damageDealt: number } {
    const nextHp: PlayerHpState = {
      white: currentHp.white,
      black: currentHp.black,
    };

    let damage = 0;

    if (options?.isCheckmate) {
      damage = moverColor === 'w' ? nextHp.black : nextHp.white;
    } else {
      if (options?.capturedPiece) {
        const type = String(options.capturedPiece).toLowerCase();
        damage += CAPTURE_DAMAGE[type] ?? 10;
      }
      if (options?.isCheck) {
        damage += CHECK_DAMAGE;
      }
      if (typeof options?.customDamage === 'number') {
        damage += options.customDamage;
      }
    }

    if (moverColor === 'w') {
      nextHp.black = Math.max(0, nextHp.black - damage);
    } else {
      nextHp.white = Math.max(0, nextHp.white - damage);
    }

    return { hp: nextHp, damageDealt: damage };
  }

  /**
   * Kiểm tra xem có người chơi nào đã hết HP (<= 0) hay chưa
   */
  checkHpEndCondition(
    hp: PlayerHpState,
    whitePlayerId: string,
    blackPlayerId: string | null,
  ): { isEnded: boolean; winnerId: string | null; reason: 'HP' | 'DRAW' | null } {
    if (hp.white <= 0 && hp.black <= 0) {
      return { isEnded: true, winnerId: null, reason: 'DRAW' };
    }
    if (hp.black <= 0) {
      return { isEnded: true, winnerId: whitePlayerId, reason: 'HP' };
    }
    if (hp.white <= 0) {
      return { isEnded: true, winnerId: blackPlayerId, reason: 'HP' };
    }
    return { isEnded: false, winnerId: null, reason: null };
  }
}