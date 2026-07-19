import type { Message, Client } from "discord.js";
import { EmbedBuilder, ChannelType } from "discord.js";
import type { Command } from "../types.js";
import { COLORS } from "../../config.js";

const serverinfo: Command = {
  name: "serverinfo",
  aliases: ["si", "server"],
  description: "View information about this server.",
  usage: ".serverinfo",
  category: "info",
  async execute(message: Message, _args: string[], _client: Client) {
    if (!message.guild) return;
    const guild = message.guild;
    await guild.fetch();

    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const botCount = guild.members.cache.filter(m => m.user.bot).size;

    const embed = new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle(`🏠 ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }) ?? "")
      .addFields(
        { name: "🆔 Server ID", value: guild.id, inline: true },
        { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "📅 Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "👥 Members", value: `${guild.memberCount - botCount} humans, ${botCount} bots`, inline: true },
        { name: "📢 Channels", value: `${textChannels} text, ${voiceChannels} voice`, inline: true },
        { name: "🎭 Roles", value: String(guild.roles.cache.size), inline: true },
        { name: "🚀 Boost Level", value: `Tier ${guild.premiumTier} (${guild.premiumSubscriptionCount ?? 0} boosts)`, inline: true },
        { name: "😄 Emojis", value: String(guild.emojis.cache.size), inline: true },
        { name: "✅ Verification", value: ["None", "Low", "Medium", "High", "Very High"][guild.verificationLevel] ?? "Unknown", inline: true },
      )
      .setImage(guild.bannerURL({ size: 1024 }) ?? "")
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default serverinfo;
