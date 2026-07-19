import { type Client, EmbedBuilder } from "discord.js";
import { db, schema } from "../database.js";
import { eq, desc } from "drizzle-orm";
import { COLORS } from "../config.js";
import { logger } from "../lib/logger.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export async function updateLeaderboards(client: Client): Promise<void> {
  const allSettings = await db.select().from(schema.guildSettings);

  for (const settings of allSettings) {
    if (!settings.leaderboardEnabled || !settings.leaderboardChannelId) continue;

    const guild = client.guilds.cache.get(settings.guildId);
    if (!guild) continue;

    const channel = guild.channels.cache.get(settings.leaderboardChannelId);
    if (!channel || !("send" in channel)) continue;

    try {
      const top = await db
        .select()
        .from(schema.userXp)
        .where(eq(schema.userXp.guildId, settings.guildId))
        .orderBy(desc(schema.userXp.totalXp))
        .limit(10);

      if (top.length === 0) continue;

      const lines = await Promise.all(top.map(async (u, i) => {
        let name = `<@${u.userId}>`;
        try { const user = await client.users.fetch(u.userId); name = user.username; } catch {}
        return `${MEDALS[i] ?? `\`${i + 1}.\``} **${name}** — ⭐ Lv.${u.level} (${(u.totalXp ?? 0).toLocaleString()} XP)`;
      }));

      const embed = new EmbedBuilder()
        .setColor(COLORS.purple)
        .setTitle("🏆 Monthly Activity Leaderboard")
        .setDescription(lines.join("\n"))
        .setFooter({ text: "Updates every 10 minutes • Use .leaderboard to view anytime" })
        .setTimestamp();

      // Edit existing message or post new one
      if (settings.leaderboardMessageId) {
        try {
          const msg = await (channel as any).messages.fetch(settings.leaderboardMessageId);
          await msg.edit({ embeds: [embed] });
          continue;
        } catch {}
      }

      // Post new message
      const sent = await (channel as any).send({ embeds: [embed] });
      await db.update(schema.guildSettings)
        .set({ leaderboardMessageId: sent.id, updatedAt: new Date() })
        .where(eq(schema.guildSettings.guildId, settings.guildId));

    } catch (e) {
      logger.error(`Leaderboard update failed for guild ${settings.guildId}`, e);
    }
  }
}
