import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { COLORS } from "../../config.js";

const userinfo: Command = {
  name: "userinfo",
  aliases: ["ui", "whois"],
  description: "View info about a user.",
  usage: ".userinfo [@user]",
  category: "info",
  async execute(message: Message, _args: string[], _client: Client) {
    if (!message.guild) return;
    const target = message.mentions.members?.first() ?? message.member!;
    const user = target.user;

    const xpData = await db.query.userXp.findFirst({
      where: and(eq(schema.userXp.guildId, message.guild.id), eq(schema.userXp.userId, user.id)),
    });
    const ecoData = await db.query.userEconomy.findFirst({
      where: and(eq(schema.userEconomy.guildId, message.guild.id), eq(schema.userEconomy.userId, user.id)),
    });

    const embed = new EmbedBuilder()
      .setColor(target.displayHexColor as `#${string}` || `#${COLORS.primary.toString(16)}`)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🆔 User ID", value: user.id, inline: true },
        { name: "📅 Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "📥 Joined Server", value: target.joinedTimestamp ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>` : "Unknown", inline: true },
        { name: "🎭 Top Role", value: `${target.roles.highest}`, inline: true },
        { name: "⭐ Level", value: xpData ? String(xpData.level) : "0", inline: true },
        { name: "💰 Coins", value: ecoData ? String(ecoData.coins) : "0", inline: true },
        { name: "🎪 Roles", value: target.roles.cache.filter(r => r.id !== message.guild!.id).map(r => `${r}`).join(", ").slice(0, 500) || "None" },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default userinfo;
