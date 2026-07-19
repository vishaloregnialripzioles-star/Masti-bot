import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, desc } from "drizzle-orm";
import { COLORS } from "../../config.js";
import { isAdmin } from "../../lib/permissions.js";
import { infoEmbed, errorEmbed, successEmbed } from "../../lib/embeds.js";

const MEDALS = ["🥇", "🥈", "🥉"];

const leaderboard: Command = {
  name: "leaderboard",
  aliases: ["lb", "top"],
  description: "Show top members. `.leaderboard xp|coins`. Admins: `.leaderboard start|stop`",
  usage: ".leaderboard [xp|coins|start|stop]",
  category: "leveling",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    const sub = args[0]?.toLowerCase() ?? "xp";

    if (sub === "start") {
      if (!isAdmin(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });
      const settings = await db.query.guildSettings.findFirst({ where: eq(schema.guildSettings.guildId, message.guild.id) });
      if (!settings?.leaderboardChannelId) {
        return void message.reply({ embeds: [errorEmbed("Setup First", "Set leaderboard channel with `.setup leaderboardchannel #channel` first.")] });
      }
      await db.update(schema.guildSettings).set({ leaderboardEnabled: true, updatedAt: new Date() }).where(eq(schema.guildSettings.guildId, message.guild.id));
      return void message.reply({ embeds: [successEmbed("Leaderboard Enabled", `Auto-updating leaderboard will post to <#${settings.leaderboardChannelId}>.`)] });
    }

    if (sub === "stop") {
      if (!isAdmin(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });
      await db.update(schema.guildSettings).set({ leaderboardEnabled: false, updatedAt: new Date() }).where(eq(schema.guildSettings.guildId, message.guild.id));
      return void message.reply({ embeds: [successEmbed("Leaderboard Disabled")] });
    }

    if (sub === "coins") {
      const top = await db
        .select()
        .from(schema.userEconomy)
        .where(eq(schema.userEconomy.guildId, message.guild.id))
        .orderBy(desc(schema.userEconomy.coins))
        .limit(10);

      if (top.length === 0) return void message.reply({ embeds: [infoEmbed("Empty Leaderboard")] });

      const lines = await Promise.all(top.map(async (u, i) => {
        let name = `<@${u.userId}>`;
        try { const user = await message.client.users.fetch(u.userId); name = user.username; } catch {}
        return `${MEDALS[i] ?? `\`${i + 1}.\``} **${name}** — 🪙 ${(u.coins + u.bank).toLocaleString()}`;
      }));

      return void message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.gold).setTitle("💰 Richest Members").setDescription(lines.join("\n")).setTimestamp()] });
    }

    // XP leaderboard (default)
    const top = await db
      .select()
      .from(schema.userXp)
      .where(eq(schema.userXp.guildId, message.guild.id))
      .orderBy(desc(schema.userXp.totalXp))
      .limit(10);

    if (top.length === 0) return void message.reply({ embeds: [infoEmbed("Empty Leaderboard", "No XP data yet.")] });

    const lines = await Promise.all(top.map(async (u, i) => {
      let name = `<@${u.userId}>`;
      try { const user = await message.client.users.fetch(u.userId); name = user.username; } catch {}
      return `${MEDALS[i] ?? `\`${i + 1}.\``} **${name}** — ⭐ Lv.${u.level} (${(u.totalXp ?? 0).toLocaleString()} XP)`;
    }));

    await message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.purple).setTitle("⭐ XP Leaderboard").setDescription(lines.join("\n")).setTimestamp()] });
  },
};

export default leaderboard;
