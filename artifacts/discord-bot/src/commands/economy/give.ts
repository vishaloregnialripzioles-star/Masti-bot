import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { COLORS } from "../../config.js";
import { getOrCreateEconomy, addCoins, removeCoins } from "../../lib/economy.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const give: Command = {
  name: "give",
  aliases: ["pay", "transfer"],
  description: "Give coins to another user.",
  usage: ".give @user <amount>",
  category: "economy",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild) return;
    const target = message.mentions.users.first();
    if (!target || target.bot || target.id === message.author.id) {
      return void message.reply({ embeds: [errorEmbed("Invalid Target")] });
    }

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 1) return void message.reply({ embeds: [errorEmbed("Invalid Amount")] });

    const removed = await removeCoins(message.guild.id, message.author.id, amount);
    if (!removed) return void message.reply({ embeds: [errorEmbed("Insufficient Funds")] });

    await addCoins(message.guild.id, target.id, amount);
    await message.reply({ embeds: [successEmbed("Coins Transferred", `You sent 🪙 **${amount.toLocaleString()} coins** to **${target.tag}**.`)] });
  },
};

export default give;
