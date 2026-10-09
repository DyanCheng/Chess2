// ============================================================
// Game Constants - Bot difficulties, time controls, rewards
// ============================================================

import { BotDifficulty } from '../types/game';

/** Bot difficulty levels - each is a different stage */
export const BOT_LEVELS: BotDifficulty[] = [
  {
    id: 'bot_1',
    level: 1,
    name: 'Tốt Nhỏ',
    description: 'Bot mới bắt đầu, di chuyển ngẫu nhiên',
    avatarUrl: 'bot_beginner',
    rating: 400,
    searchDepth: 1,
    isUnlocked: true,
    requiredLevel: 1,
    reward: { gold: 50, experience: 20 },
  },
  {
    id: 'bot_2',
    level: 2,
    name: 'Kỵ Sĩ Đồng',
    description: 'Bot biết chiến thuật cơ bản',
    avatarUrl: 'bot_bronze',
    rating: 600,
    searchDepth: 2,
    isUnlocked: true,
    requiredLevel: 3,
    reward: { gold: 80, experience: 35 },
  },
  {
    id: 'bot_3',
    level: 3,
    name: 'Tượng Bạc',
    description: 'Bot có khả năng tấn công tốt',
    avatarUrl: 'bot_silver',
    rating: 900,
    searchDepth: 3,
    isUnlocked: false,
    requiredLevel: 5,
    reward: { gold: 120, experience: 50 },
  },
  {
    id: 'bot_4',
    level: 4,
    name: 'Xe Vàng',
    description: 'Bot phòng thủ vững chắc',
    avatarUrl: 'bot_gold',
    rating: 1200,
    searchDepth: 4,
    isUnlocked: false,
    requiredLevel: 8,
    reward: { gold: 180, experience: 75, gems: 5 },
  },
  {
    id: 'bot_5',
    level: 5,
    name: 'Hậu Bạch Kim',
    description: 'Bot chiến thuật cao cấp',
    avatarUrl: 'bot_platinum',
    rating: 1500,
    searchDepth: 5,
    isUnlocked: false,
    requiredLevel: 12,
    reward: { gold: 250, experience: 100, gems: 10 },
  },
  {
    id: 'bot_6',
    level: 6,
    name: 'Vua Kim Cương',
    description: 'Bot siêu trí tuệ, gần như bất bại',
    avatarUrl: 'bot_diamond',
    rating: 1800,
    searchDepth: 6,
    isUnlocked: false,
    requiredLevel: 15,
    reward: { gold: 400, experience: 150, gems: 20 },
  },
  {
    id: 'bot_7',
    level: 7,
    name: 'Đại Sư Huyền Thoại',
    description: 'Thử thách cuối cùng - không khoan nhượng',
    avatarUrl: 'bot_legend',
    rating: 2200,
    searchDepth: 8,
    isUnlocked: false,
    requiredLevel: 20,
    reward: { gold: 600, experience: 250, gems: 50 },
  },
];

/** Time control presets (in minutes) */
export const TIME_CONTROLS = [
  { label: 'Bullet', time: 1, increment: 0 },
  { label: 'Blitz', time: 3, increment: 2 },
  { label: 'Rapid', time: 5, increment: 3 },
  { label: 'Classic', time: 10, increment: 5 },
  { label: 'Long', time: 15, increment: 10 },
] as const;

/** XP required for each level */
export const LEVEL_XP_TABLE: number[] = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  450,   // Level 4
  700,   // Level 5
  1000,  // Level 6
  1400,  // Level 7
  1900,  // Level 8
  2500,  // Level 9
  3200,  // Level 10
  4000,  // Level 11
  5000,  // Level 12
  6200,  // Level 13
  7600,  // Level 14
  9200,  // Level 15
  11000, // Level 16
  13000, // Level 17
  15500, // Level 18
  18500, // Level 19
  22000, // Level 20
  26000, // Level 21
  30500, // Level 22
  35500, // Level 23
  41000, // Level 24
  50000, // Level 25
];

/** Rating change range per game */
export const RATING_CONFIG = {
  kFactor: 32,
  minRating: 100,
  maxRating: 3000,
  initialRating: 800,
} as const;

/** Rewards for winning PVP */
export const PVP_REWARDS = {
  win: { gold: 30, experience: 25 },
  loss: { gold: 5, experience: 10 },
  draw: { gold: 15, experience: 15 },
} as const;
