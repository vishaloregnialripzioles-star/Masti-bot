import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and, desc } from "drizzle-orm";
import { COLORS, xpForLevel } from "../../config.js";
import { getOrCreateXp } from "../../lib/xp.js";

const rank: Command = {
  name: "rank",
  aliases: ["level", "xp"],
  description: "Check your XP rank (or another user's).",
  usage: ".rank [@user]",
  category: "leveling",
  async execute(message: Message, _args: string[], _client: Client) {
    if (!message.guild) return;
    const target = message.mentions.users.first() ?? message.author;
    const xpData = await getOrCreateXp(message.guild.id, target.id);

    const xpNeeded = xpForLevel(xpData.level + 1);
    const progressPct = Math.min(100, Math.floor((xpData.xp / xpNeeded) * 100));
    const filled = Math.floor(progressPct / 10);
    const progressBar = "🟦".repeat(filled) + "⬛".repeat(10 - filled);

    // Get rank position
    const allUsers = await db
      .select()
      .from(schema.userXp)
      .where(eq(schema.userXp.guildId, message.guild.id))
      .orderBy(desc(schema.userXp.totalXp));
    const position = allUsers.findIndex(u => u.userId === target.id) + 1;

    const embed = new EmbedBuilder()
      .setColor(COLORS.purple)
      .setTitle(`⭐ ${target.username}'s Rank`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "🏆 Rank", value: `#${position} of ${allUsers.length}`, inline: true },
        { name: "📊 Level", value: String(xpData.level), inline: true },
        { name: "✨ Total XP", value: `${(xpData.totalXp ?? 0).toLocaleString()}`, inline: true },
        { name: `Progress to Level ${xpData.level + 1}`, value: `${progressBar} ${progressPct}%\n${xpData.xp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP` },
      );

    await message.reply({ embeds: [embed] });
  },
};

export default rank;
