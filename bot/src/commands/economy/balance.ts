import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { COLORS } from "../../config.js";
import { getOrCreateEconomy } from "../../lib/economy.js";

const balance: Command = {
  name: "balance",
  aliases: ["bal", "coins", "wallet"],
  description: "Check your coin balance (or another user's).",
  usage: ".balance [@user]",
  category: "economy",
  async execute(message: Message, _args: string[], _client: Client) {
    if (!message.guild) return;
    const target = message.mentions.users.first() ?? message.author;
    const eco = await getOrCreateEconomy(message.guild.id, target.id);

    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle(`💰 ${target.username}'s Balance`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "👛 Wallet", value: `🪙 **${eco.coins.toLocaleString()}** coins`, inline: true },
        { name: "🏦 Bank", value: `🪙 **${eco.bank.toLocaleString()}** coins`, inline: true },
        { name: "💎 Total", value: `🪙 **${(eco.coins + eco.bank).toLocaleString()}** coins`, inline: true },
      );

    await message.reply({ embeds: [embed] });
  },
};

export default balance;
