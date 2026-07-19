import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { COLORS } from "../../config.js";
import { infoEmbed } from "../../lib/embeds.js";

const listlevelroles: Command = {
  name: "listlevelroles",
  aliases: ["levelroles", "llr"],
  description: "View all level role rewards.",
  usage: ".listlevelroles",
  category: "leveling",
  async execute(message: Message, _args: string[], _client: Client) {
    if (!message.guild) return;
    const roles = await db.select().from(schema.levelRoles).where(eq(schema.levelRoles.guildId, message.guild.id));
    if (roles.length === 0) return void message.reply({ embeds: [infoEmbed("No Level Roles", "Set some with `.setlevelrole <level> @role`")] });

    const sorted = roles.sort((a, b) => a.level - b.level);
    const embed = new EmbedBuilder()
      .setColor(COLORS.purple)
      .setTitle("⭐ Level Role Rewards")
      .setDescription(sorted.map(r => `**Level ${r.level}** → <@&${r.roleId}>`).join("\n"));

    await message.reply({ embeds: [embed] });
  },
};

export default listlevelroles;
