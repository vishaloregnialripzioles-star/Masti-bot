import { Events, type Client, type VoiceState } from "discord.js";
import { db, schema } from "../database.js";
import { eq } from "drizzle-orm";
import { addXp } from "../lib/xp.js";
import { XP_CONFIG } from "../config.js";
import { logger } from "../lib/logger.js";

// Track when users joined voice: userId -> joinedAt timestamp
const voiceSessions = new Map<string, number>();

export default function registerVoiceStateUpdate(client: Client) {
  // Award voice XP every 2 minutes for connected users
  setInterval(async () => {
    for (const [key, joinedAt] of voiceSessions) {
      const [guildId, userId] = key.split(":");
      if (!guildId || !userId) continue;
      try {
        const settings = await db.query.guildSettings.findFirst({ where: eq(schema.guildSettings.guildId, guildId) });
        if (settings?.xpEnabled === false) continue;
        await addXp(guildId, userId, XP_CONFIG.voiceXpPerMinute * 2);
      } catch (e) {
        logger.error("Voice XP error", e);
      }
    }
  }, 2 * 60 * 1000);

  client.on(Events.VoiceStateUpdate, (oldState: VoiceState, newState: VoiceState) => {
    const userId = newState.member?.id ?? oldState.member?.id;
    if (!userId || newState.member?.user.bot) return;
    const guildId = newState.guild.id;
    const key = `${guildId}:${userId}`;

    // Joined a voice channel
    if (!oldState.channel && newState.channel) {
      voiceSessions.set(key, Date.now());
    }

    // Left voice channel
    if (oldState.channel && !newState.channel) {
      voiceSessions.delete(key);
    }
  });
}
