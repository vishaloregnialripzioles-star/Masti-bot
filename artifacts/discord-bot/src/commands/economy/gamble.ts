import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { COLORS, ECONOMY_CONFIG } from "../../config.js";
import { getOrCreateEconomy } from "../../lib/economy.js";
import { errorEmbed } from "../../lib/embeds.js";

const gamble: Command = {
  name: "gamble",
  aliases: ["bet"],
  description: "Gamble coins for a 50/50 chance to double them.",
  usage: ".gamble <amount|all|half>",
  category: "economy",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild) return;
    const eco = await getOrCreateEconomy(message.guild.id, message.author.id);

    let amount = 0;
    const input = args[0]?.toLowerCase();
    if (input === "all") amount = eco.coins;
    else if (input === "half") amount = Math.floor(eco.coins / 2);
    else amount = parseInt(input);

    if (isNaN(amount) || amount < ECONOMY_CONFIG.gambleMinBet) {
      return void message.reply({ embeds: [errorEmbed("Invalid Bet", `Minimum bet is **${ECONOMY_CONFIG.gambleMinBet} coins**.`)] });
    }
    if (amount > eco.coins) {
      return void message.reply({ embeds: [errorEmbed("Insufficient Funds", `You only have **${eco.coins} coins**.`)] });
    }

    const win = Math.random() >= 0.5;
    const newCoins = win ? eco.coins + amount : eco.coins - amount;

    await db.update(schema.userEconomy)
      .set({ coins: Math.max(0, newCoins), updatedAt: new Date() })
      .where(eq(schema.userEconomy.id, `${message.guild.id}:${message.author.id}`));

    const embed = new EmbedBuilder()
      .setColor(win ? COLORS.success : COLORS.error)
      .setTitle(win ? "🎰 You Won!" : "🎰 You Lost!")
      .addFields(
        { name: "Bet", value: `🪙 ${amount.toLocaleString()}`, inline: true },
        { name: win ? "Won" : "Lost", value: `🪙 ${amount.toLocaleString()}`, inline: true },
        { name: "New Balance", value: `🪙 ${Math.max(0, newCoins).toLocaleString()}`, inline: true },
      )
      .setDescription(win ? "🍀 Lucky! The coin landed in your favor." : "😬 Unlucky! Better luck next time.");

    await message.reply({ embeds: [embed] });
  },
};

export default gamble;
