import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { isAdmin } from "../../lib/permissions.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const removelevelrole: Command = {
  name: "removelevelrole",
  aliases: ["rlr"],
  description: "Remove a level role reward.",
  usage: ".removelevelrole <level>",
  category: "leveling",
  adminOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isAdmin(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });

    const level = parseInt(args[0]);
    if (isNaN(level)) return void message.reply({ embeds: [errorEmbed("Usage", "`.removelevelrole <level>`")] });

    await db.delete(schema.levelRoles).where(and(eq(schema.levelRoles.guildId, message.guild.id), eq(schema.levelRoles.level, level)));
    await message.reply({ embeds: [successEmbed("Level Role Removed", `Role reward for Level ${level} removed.`)] });
  },
};

export default removelevelrole;
