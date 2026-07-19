import type { Message } from "discord.js";
import { AUTOMOD_CONFIG } from "../config.js";

// Track recent messages per user: userId -> { count, resetAt }
const spamTracker = new Map<string, { count: number; resetAt: number }>();

export async function checkSpam(message: Message): Promise<boolean> {
  if (!message.guild) return false;
  const key = `${message.guild.id}:${message.author.id}:${message.channel.id}`;
  const now = Date.now();

  const tracker = spamTracker.get(key) ?? { count: 0, resetAt: now + 5000 };

  if (now > tracker.resetAt) {
    tracker.count = 1;
    tracker.resetAt = now + 5000;
  } else {
    tracker.count++;
  }

  spamTracker.set(key, tracker);

  if (tracker.count >= 6) {
    try { await message.delete(); } catch {}
    if (tracker.count === 6) {
      try {
        await message.author.send(`⚠️ You're sending messages too fast in **${message.guild.name}**. Please slow down.`);
      } catch {}
    }
    return true;
  }

  return false;
}
