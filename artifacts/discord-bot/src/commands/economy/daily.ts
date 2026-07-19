import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { COLORS, ECONOMY_CONFIG } from "../../config.js";
import { getOrCreateEconomy, addCoins } from "../../lib/economy.js";
import { errorEmbed } from "../../lib/embeds.js";

const daily: Command = {
  name: "daily",
  description: `Claim your daily ${ECONOMY_CONFIG.dailyReward} coins reward.`,
  usage: ".daily",
  category: "economy",
  async execute(message: Message, _args: string[], _client: Client) {
    if (!message.guild) return;
    const eco = await getOrCreateEconomy(message.guild.id, message.author.id);

    if (eco.lastDailyAt) {
      const nextDaily = new Date(eco.lastDailyAt).getTime() + 24 * 60 * 60 * 1000;
      if (Date.now() < nextDaily) {
        const remaining = nextDaily - Date.now();
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        return void message.reply({ embeds: [errorEmbed("Already Claimed", `You can claim again in **${hours}h ${minutes}m**.`)] });
      }
    }

    await db.update(schema.userEconomy)
      .set({ lastDailyAt: new Date(), coins: eco.coins + ECONOMY_CONFIG.dailyReward, updatedAt: new Date() })
      .where(eq(schema.userEconomy.id, `${message.guild.id}:${message.author.id}`));

    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle("🎁 Daily Reward Claimed!")
      .setDescription(`You received **${ECONOMY_CONFIG.dailyReward} coins**! 🪙\nCome back tomorrow for more.`)
      .addFields({ name: "New Balance", value: `🪙 ${(eco.coins + ECONOMY_CONFIG.dailyReward).toLocaleString()} coins` });

    await message.reply({ embeds: [embed] });
  },
};

export default daily;
