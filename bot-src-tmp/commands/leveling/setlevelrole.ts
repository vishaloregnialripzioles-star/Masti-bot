import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { isAdmin } from "../../lib/permissions.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const setlevelrole: Command = {
  name: "setlevelrole",
  aliases: ["slr"],
  description: "Set a role reward for reaching a level.",
  usage: ".setlevelrole <level> @role",
  category: "leveling",
  adminOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isAdmin(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });

    const level = parseInt(args[0]);
    const role = message.mentions.roles.first();
    if (isNaN(level) || level < 1 || !role) {
      return void message.reply({ embeds: [errorEmbed("Usage", "`.setlevelrole <level> @role`")] });
    }

    const existing = await db.query.levelRoles.findFirst({
      where: and(eq(schema.levelRoles.guildId, message.guild.id), eq(schema.levelRoles.level, level)),
    });

    if (existing) {
      await db.update(schema.levelRoles).set({ roleId: role.id }).where(eq(schema.levelRoles.id, existing.id));
    } else {
      await db.insert(schema.levelRoles).values({ guildId: message.guild.id, level, roleId: role.id, createdBy: message.author.id });
    }

    await message.reply({ embeds: [successEmbed("Level Role Set", `Reaching **Level ${level}** will now grant the **${role.name}** role.`)] });
  },
};

export default setlevelrole;
