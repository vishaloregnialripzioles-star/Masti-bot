import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { COLORS, ECONOMY_CONFIG } from "../../config.js";
import { getOrCreateEconomy } from "../../lib/economy.js";
import { errorEmbed } from "../../lib/embeds.js";

const flip: Command = {
  name: "flip",
  aliases: ["coinflip", "cf"],
  description: "Flip a coin! Guess heads or tails.",
  usage: ".flip <heads|tails> <amount>",
  category: "economy",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild) return;
    const choice = args[0]?.toLowerCase();
    if (choice !== "heads" && choice !== "tails") {
      return void message.reply({ embeds: [errorEmbed("Usage", "`.flip <heads|tails> <amount>`")] });
    }

    const eco = await getOrCreateEconomy(message.guild.id, message.author.id);
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < ECONOMY_CONFIG.gambleMinBet) {
      return void message.reply({ embeds: [errorEmbed("Invalid Bet")] });
    }
    if (amount > eco.coins) {
      return void message.reply({ embeds: [errorEmbed("Insufficient Funds")] });
    }

    const result = Math.random() < 0.5 ? "heads" : "tails";
    const win = result === choice;
    const newCoins = win ? eco.coins + amount : eco.coins - amount;

    await db.update(schema.userEconomy)
      .set({ coins: Math.max(0, newCoins), updatedAt: new Date() })
      .where(eq(schema.userEconomy.id, `${message.guild.id}:${message.author.id}`));

    const embed = new EmbedBuilder()
      .setColor(win ? COLORS.success : COLORS.error)
      .setTitle(`🪙 Coin Flip — ${result === "heads" ? "🦅 Heads" : "🦁 Tails"}`)
      .setDescription(win ? `✅ Correct! You guessed **${choice}**.` : `❌ Wrong! It was **${result}**.`)
      .addFields({ name: "Balance", value: `🪙 ${Math.max(0, newCoins).toLocaleString()}` });

    await message.reply({ embeds: [embed] });
  },
};

export default flip;
