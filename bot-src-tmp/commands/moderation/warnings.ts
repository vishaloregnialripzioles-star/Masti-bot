import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and, desc } from "drizzle-orm";
import { COLORS } from "../../config.js";
import { isModerator } from "../../lib/permissions.js";
import { errorEmbed } from "../../lib/embeds.js";

const warnings: Command = {
  name: "warnings",
  aliases: ["warns"],
  description: "View warnings for a user.",
  usage: ".warnings @user",
  category: "moderation",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) {
      return void message.reply({ embeds: [errorEmbed("No Permission", "You need Manage Messages or higher.")] });
    }

    const target = message.mentions.users.first();
    if (!target) {
      return void message.reply({ embeds: [errorEmbed("Missing Target", "Please mention a user.")] });
    }

    const userWarnings = await db
      .select()
      .from(schema.warnings)
      .where(and(eq(schema.warnings.guildId, message.guild.id), eq(schema.warnings.userId, target.id)))
      .orderBy(desc(schema.warnings.createdAt))
      .limit(10);

    if (userWarnings.length === 0) {
      return void message.reply({ embeds: [new EmbedBuilder().setColor(COLORS.success).setDescription(`✅ **${target.tag}** has no warnings.`)] });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.warning)
      .setTitle(`⚠️ Warnings for ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: `Total: ${userWarnings.length} warning(s)` });

    for (const w of userWarnings) {
      embed.addFields({
        name: `#${w.id} — ${new Date(w.createdAt).toLocaleDateString()}`,
        value: `**Reason:** ${w.reason}\n**By:** <@${w.moderatorId}>`,
      });
    }

    await message.reply({ embeds: [embed] });
  },
};

export default warnings;
