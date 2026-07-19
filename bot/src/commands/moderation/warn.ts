import { type Message, type Client, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import type { Command } from "../types.js";
import { db } from "../../database.js";
import { schema } from "../../database.js";
import { eq, and, count } from "drizzle-orm";
import { COLORS, WARNING_ESCALATION, TIMEOUT_DURATION_MS } from "../../config.js";
import { isModerator, canModerate } from "../../lib/permissions.js";
import { modEmbed, errorEmbed } from "../../lib/embeds.js";

const warn: Command = {
  name: "warn",
  description: "Warn a member. Auto-escalates at 3 (timeout) and 5 (ban) warnings.",
  usage: ".warn @user [reason]",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) {
      return void message.reply({ embeds: [errorEmbed("No Permission", "You need Manage Messages or higher.")] });
    }

    const target = message.mentions.members?.first();
    if (!target) {
      return void message.reply({ embeds: [errorEmbed("Missing Target", "Please mention a member to warn.")] });
    }
    if (!canModerate(message.member, target)) {
      return void message.reply({ embeds: [errorEmbed("Cannot Moderate", "You cannot warn someone with a higher or equal role.")] });
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    await db.insert(schema.warnings).values({
      guildId: message.guild.id,
      userId: target.id,
      moderatorId: message.author.id,
      reason,
    });

    const [{ value: warnCount }] = await db
      .select({ value: count() })
      .from(schema.warnings)
      .where(and(eq(schema.warnings.guildId, message.guild.id), eq(schema.warnings.userId, target.id)));

    // Send DM to warned user
    try {
      const settings = await db.query.guildSettings.findFirst({ where: eq(schema.guildSettings.guildId, message.guild.id) });
      let dmContent = `⚠️ You have been warned in **${message.guild.name}**.\n**Reason:** ${reason}\n**Total warnings:** ${warnCount}`;

      // Check for warn DM template
      if (settings) {
        const tmpl = await db.query.messageTemplates.findFirst({
          where: and(eq(schema.messageTemplates.guildId, message.guild.id), eq(schema.messageTemplates.name, "warn_dm")),
        });
        if (tmpl) {
          dmContent = tmpl.content
            .replace("{user}", target.user.tag)
            .replace("{reason}", reason)
            .replace("{server}", message.guild.name)
            .replace("{warnings}", String(warnCount));
        }
      }
      await target.send(dmContent);
    } catch {}

    await message.reply({
      embeds: [modEmbed("Member Warned", target.user, message.author, reason, { "Total Warnings": String(warnCount) })],
    });

    // Auto-escalate
    const escalation = WARNING_ESCALATION as Record<number, string>;
    if (escalation[warnCount] === "timeout") {
      try {
        await target.timeout(TIMEOUT_DURATION_MS, `Auto-escalation: ${warnCount} warnings`);
        if ("send" in message.channel) {
          await message.channel.send({
            embeds: [new EmbedBuilder()
              .setColor(COLORS.warning)
              .setDescription(`⏱️ **${target.user.tag}** has been timed out for 1 hour (${warnCount} warnings).`)],
          });
        }
      } catch {}
    } else if (escalation[warnCount] === "ban") {
      try {
        await target.ban({ reason: `Auto-escalation: ${warnCount} warnings` });
        if ("send" in message.channel) {
          await message.channel.send({
            embeds: [new EmbedBuilder()
              .setColor(COLORS.error)
              .setDescription(`🔨 **${target.user.tag}** has been banned (${warnCount} warnings).`)],
          });
        }
      } catch {}
    }
  },
};

export default warn;
