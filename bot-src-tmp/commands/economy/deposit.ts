import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { getOrCreateEconomy } from "../../lib/economy.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const deposit: Command = {
  name: "deposit",
  aliases: ["dep"],
  description: "Deposit coins into your bank.",
  usage: ".deposit <amount|all>",
  category: "economy",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild) return;
    const eco = await getOrCreateEconomy(message.guild.id, message.author.id);
    const input = args[0]?.toLowerCase();
    const amount = input === "all" ? eco.coins : parseInt(input);
    if (isNaN(amount) || amount < 1) return void message.reply({ embeds: [errorEmbed("Invalid Amount")] });
    if (amount > eco.coins) return void message.reply({ embeds: [errorEmbed("Insufficient Funds")] });

    await db.update(schema.userEconomy)
      .set({ coins: eco.coins - amount, bank: eco.bank + amount, updatedAt: new Date() })
      .where(eq(schema.userEconomy.id, `${message.guild.id}:${message.author.id}`));

    await message.reply({ embeds: [successEmbed("Deposited", `🏦 Deposited 🪙 **${amount.toLocaleString()}** coins.`)] });
  },
};

export default deposit;
