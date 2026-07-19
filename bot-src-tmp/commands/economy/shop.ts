import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { isAdmin } from "../../lib/permissions.js";
import { COLORS } from "../../config.js";
import { errorEmbed, infoEmbed, successEmbed } from "../../lib/embeds.js";

const shop: Command = {
  name: "shop",
  description: "Browse the server shop. Admins: `.shop add <name> <price> [roleId] [description]`",
  usage: ".shop [add|remove]",
  category: "economy",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "add") {
      if (!isAdmin(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });
      const name = args[1];
      const price = parseInt(args[2]);
      if (!name || isNaN(price)) return void message.reply({ embeds: [errorEmbed("Usage", "`.shop add <name> <price> [@role] [description]`")] });
      const role = message.mentions.roles.first();
      const desc = args.slice(role ? 4 : 3).join(" ") || "A shop item";
      await db.insert(schema.shopItems).values({
        guildId: message.guild.id, name, price, description: desc,
        roleId: role?.id, itemType: role ? "vanity" : "badge",
        createdBy: message.author.id,
      });
      return void message.reply({ embeds: [successEmbed("Item Added", `**${name}** added to shop for 🪙 ${price} coins.`)] });
    }

    if (sub === "remove") {
      if (!isAdmin(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });
      const id = parseInt(args[1]);
      if (isNaN(id)) return void message.reply({ embeds: [errorEmbed("Usage", "`.shop remove <id>`")] });
      await db.delete(schema.shopItems).where(and(eq(schema.shopItems.id, id), eq(schema.shopItems.guildId, message.guild.id)));
      return void message.reply({ embeds: [successEmbed("Item Removed")] });
    }

    const items = await db.select().from(schema.shopItems).where(and(eq(schema.shopItems.guildId, message.guild.id), eq(schema.shopItems.available, true)));
    if (items.length === 0) return void message.reply({ embeds: [infoEmbed("Empty Shop", "No items available yet.")] });

    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle("🛒 Server Shop")
      .setDescription(items.map(i =>
        `**${i.id}. ${i.emoji ?? "🏷️"} ${i.name}** — 🪙 ${i.price.toLocaleString()}\n${i.description}${i.roleId ? ` → <@&${i.roleId}>` : ""}`
      ).join("\n\n"))
      .setFooter({ text: "Buy with .buy <id>" });

    await message.reply({ embeds: [embed] });
  },
};

export default shop;
