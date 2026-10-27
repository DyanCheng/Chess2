export enum BotDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export function normalizeBotDifficulty(input?: string): BotDifficulty {
  if (!input) return BotDifficulty.EASY;
  const upper = input.toUpperCase();
  if (upper === 'MEDIUM') return BotDifficulty.MEDIUM;
  if (upper === 'HARD') return BotDifficulty.HARD;
  return BotDifficulty.EASY;
}