import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { isModerator } from "../../lib/permissions.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const clearwarnings: Command = {
  name: "clearwarnings",
  aliases: ["clearwarns", "resetwarnings"],
  description: "Clear all warnings for a user.",
  usage: ".clearwarnings @user",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, _args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) {
      return void message.reply({ embeds: [errorEmbed("No Permission")] });
    }

    const target = message.mentions.users.first();
    if (!target) {
      return void message.reply({ embeds: [errorEmbed("Missing Target", "Please mention a user.")] });
    }

    await db.delete(schema.warnings).where(
      and(eq(schema.warnings.guildId, message.guild.id), eq(schema.warnings.userId, target.id))
    );

    await message.reply({ embeds: [successEmbed("Warnings Cleared", `All warnings for **${target.tag}** have been removed.`)] });
  },
};

export default clearwarnings;
