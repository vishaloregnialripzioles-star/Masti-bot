import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { getOrCreateEconomy } from "../../lib/economy.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const withdraw: Command = {
  name: "withdraw",
  aliases: ["with"],
  description: "Withdraw coins from your bank.",
  usage: ".withdraw <amount|all>",
  category: "economy",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild) return;
    const eco = await getOrCreateEconomy(message.guild.id, message.author.id);
    const input = args[0]?.toLowerCase();
    const amount = input === "all" ? eco.bank : parseInt(input);
    if (isNaN(amount) || amount < 1) return void message.reply({ embeds: [errorEmbed("Invalid Amount")] });
    if (amount > eco.bank) return void message.reply({ embeds: [errorEmbed("Insufficient Bank Balance")] });

    await db.update(schema.userEconomy)
      .set({ coins: eco.coins + amount, bank: eco.bank - amount, updatedAt: new Date() })
      .where(eq(schema.userEconomy.id, `${message.guild.id}:${message.author.id}`));

    await message.reply({ embeds: [successEmbed("Withdrawn", `👛 Withdrew 🪙 **${amount.toLocaleString()}** coins.`)] });
  },
};

export default withdraw;
