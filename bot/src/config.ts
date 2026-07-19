export const PREFIX = ".";

export const COLORS = {
  primary: 0x5865f2,
  success: 0x57f287,
  warning: 0xfee75c,
  error: 0xed4245,
  info: 0x5865f2,
  purple: 0x9b59b6,
  gold: 0xf1c40f,
} as const;

export const XP_CONFIG = {
  minPerMessage: 15,
  maxPerMessage: 25,
  cooldownMs: 60_000,
  voiceXpPerMinute: 5,
  levelMultiplier: 100, // XP needed = level * multiplier
} as const;

export const ECONOMY_CONFIG = {
  minEarnPerMessage: 1,
  maxEarnPerMessage: 5,
  earnCooldownMs: 60_000,
  dailyReward: 200,
  gambleMinBet: 10,
  petFeedCost: 50,
} as const;

export const AUTOMOD_CONFIG = {
  maxEmojisPerMessage: 10,
  minCapsLengthToCheck: 10,
  capsThresholdPercent: 70,
  inviteRegex: /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9-]+/i,
} as const;

export const WARNING_ESCALATION = {
  3: "timeout",   // 3 warnings → 1-hour timeout
  5: "ban",       // 5 warnings → ban
} as const;

export const TIMEOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function xpForLevel(level: number): number {
  return level * XP_CONFIG.levelMultiplier * (level + 1);
}

export function levelForXp(totalXp: number): number {
  let level = 0;
  while (totalXp >= xpForLevel(level + 1)) {
    level++;
  }
  return level;
}
