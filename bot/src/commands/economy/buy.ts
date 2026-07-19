import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { getOrCreateEconomy, removeCoins } from "../../lib/economy.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const buy: Command = {
  name: "buy",
  description: "Purchase an item from the shop.",
  usage: ".buy <item id>",
  category: "economy",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    const itemId = parseInt(args[0]);
    if (isNaN(itemId)) return void message.reply({ embeds: [errorEmbed("Usage", "`.buy <item id>` — use `.shop` to see IDs")] });

    const item = await db.query.shopItems.findFirst({ where: and(eq(schema.shopItems.id, itemId), eq(schema.shopItems.guildId, message.guild.id), eq(schema.shopItems.available, true)) });
    if (!item) return void message.reply({ embeds: [errorEmbed("Item Not Found")] });

    const removed = await removeCoins(message.guild.id, message.author.id, item.price);
    if (!removed) return void message.reply({ embeds: [errorEmbed("Insufficient Funds", `You need 🪙 **${item.price}** coins.`)] });

    if (item.roleId) {
      const role = message.guild.roles.cache.get(item.roleId);
      if (role) {
        try { await message.member.roles.add(role); } catch {}
      }
    }

    // Reduce stock
    if (item.stock > 0) {
      await db.update(schema.shopItems).set({ stock: item.stock - 1, available: item.stock - 1 > 0 }).where(eq(schema.shopItems.id, item.id));
    }

    await message.reply({ embeds: [successEmbed("Purchase Successful!", `You bought **${item.name}** for 🪙 ${item.price} coins!${item.roleId ? " You've received your role." : ""}`)] });
  },
};

export default buy;
