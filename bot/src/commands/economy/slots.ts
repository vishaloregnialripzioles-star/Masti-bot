import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { COLORS, ECONOMY_CONFIG } from "../../config.js";
import { getOrCreateEconomy } from "../../lib/economy.js";
import { errorEmbed } from "../../lib/embeds.js";

const SLOTS = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "🎰"];
const PAYOUTS: Record<string, number> = { "💎": 10, "⭐": 5, "🎰": 8, "🍇": 3, "🍊": 2, "🍋": 1.5, "🍒": 1.2 };

const slots: Command = {
  name: "slots",
  description: "Spin the slot machine!",
  usage: ".slots <amount>",
  category: "economy",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild) return;
    const eco = await getOrCreateEconomy(message.guild.id, message.author.id);

    let amount = parseInt(args[0]);
    if (isNaN(amount) || amount < ECONOMY_CONFIG.gambleMinBet) {
      return void message.reply({ embeds: [errorEmbed("Invalid Bet", `Minimum bet is **${ECONOMY_CONFIG.gambleMinBet} coins**.`)] });
    }
    if (amount > eco.coins) {
      return void message.reply({ embeds: [errorEmbed("Insufficient Funds", `You only have **${eco.coins} coins**.`)] });
    }

    const spin = () => SLOTS[Math.floor(Math.random() * SLOTS.length)];
    const reels = [spin(), spin(), spin()];
    const display = reels.join(" | ");

    let multiplier = 0;
    let result = "❌ No match";

    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      multiplier = PAYOUTS[reels[0]] ?? 2;
      result = `🎉 JACKPOT! ${reels[0]} x3`;
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      multiplier = 0.5;
      result = "✨ Partial match — half back";
    }

    const winnings = Math.floor(amount * multiplier);
    const delta = winnings - amount;
    const newCoins = eco.coins + delta;

    await db.update(schema.userEconomy)
      .set({ coins: Math.max(0, newCoins), updatedAt: new Date() })
      .where(eq(schema.userEconomy.id, `${message.guild.id}:${message.author.id}`));

    const embed = new EmbedBuilder()
      .setColor(delta >= 0 ? COLORS.success : COLORS.error)
      .setTitle("🎰 Slot Machine")
      .setDescription(`\`[ ${display} ]\`\n\n${result}`)
      .addFields(
        { name: "Bet", value: `🪙 ${amount.toLocaleString()}`, inline: true },
        { name: delta >= 0 ? "Won" : "Lost", value: `🪙 ${Math.abs(delta).toLocaleString()}`, inline: true },
        { name: "Balance", value: `🪙 ${Math.max(0, newCoins).toLocaleString()}`, inline: true },
      );

    await message.reply({ embeds: [embed] });
  },
};

export default slots;
