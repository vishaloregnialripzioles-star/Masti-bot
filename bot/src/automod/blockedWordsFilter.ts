import type { Message } from "discord.js";
import { db, schema } from "../database.js";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger.js";

// Cache blocked words per guild, TTL 60s
const cache = new Map<string, { words: string[]; expiresAt: number }>();

export async function checkBlockedWords(message: Message): Promise<boolean> {
  if (!message.guild) return false;
  const guildId = message.guild.id;

  let words: string[];
  const cached = cache.get(guildId);
  if (cached && Date.now() < cached.expiresAt) {
    words = cached.words;
  } else {
    const rows = await db.select().from(schema.blockedWords).where(eq(schema.blockedWords.guildId, guildId));
    words = rows.map(r => r.word.toLowerCase());
    cache.set(guildId, { words, expiresAt: Date.now() + 60_000 });
  }

  if (words.length === 0) return false;

  const content = message.content.toLowerCase();
  const triggered = words.find(w => content.includes(w));
  if (!triggered) return false;

  try {
    await message.delete();
  } catch {}

  // Warn user via DM
  try {
    const settings = await db.query.guildSettings.findFirst({ where: eq(schema.guildSettings.guildId, guildId) });
    let dmContent = `🚫 Your message in **${message.guild.name}** was deleted for containing a blocked word.\nPlease review the server rules.`;

    // Check for blocked_word_dm template
    const tmpl = await db.query.messageTemplates.findFirst({
      where: and(eq(schema.messageTemplates.guildId, guildId), eq(schema.messageTemplates.name, "blocked_word_dm")),
    });
    if (tmpl) {
      dmContent = tmpl.content
        .replace("{user}", message.author.tag)
        .replace("{server}", message.guild.name)
        .replace("{word}", triggered);
    }
    await message.author.send(dmContent);
  } catch {}

  logger.info(`Blocked word "${triggered}" detected from ${message.author.tag} in guild ${guildId}`);
  return true;
}

// Invalidate cache when words are updated
export function invalidateBlockedWordsCache(guildId: string) {
  cache.delete(guildId);
}
