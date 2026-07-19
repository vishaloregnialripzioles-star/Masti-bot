import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { snipeCache } from "../../events/messageDelete.js";
import { COLORS } from "../../config.js";
import { errorEmbed } from "../../lib/embeds.js";

const snipe: Command = {
  name: "snipe",
  aliases: ["s"],
  description: "Show the most recently deleted message in this channel.",
  usage: ".snipe",
  category: "moderation",
  async execute(message: Message, _args: string[], _client: Client) {
    if (!message.guild) return;

    const cached = snipeCache.get(message.channel.id);
    if (!cached) {
      return void message.reply({ embeds: [errorEmbed("Nothing to Snipe", "No recently deleted messages in this channel.")] });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle("🔍 Sniped Message")
      .setDescription(cached.content || "*[No text content]*")
      .setAuthor({ name: cached.authorTag, iconURL: cached.authorAvatar })
      .setFooter({ text: `Deleted at ${new Date(cached.deletedAt).toLocaleString()}` });

    if (cached.imageUrl) embed.setImage(cached.imageUrl);

    await message.reply({ embeds: [embed] });
  },
};

export default snipe;
