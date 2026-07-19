import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { isModerator } from "../../lib/permissions.js";
import { successEmbed, errorEmbed, infoEmbed } from "../../lib/embeds.js";
import { COLORS } from "../../config.js";

const template: Command = {
  name: "template",
  aliases: ["tmpl"],
  description: "Manage message templates for DMs. Subcommands: create, list, delete, dm",
  usage: ".template <create|list|delete|dm> [args]",
  category: "utility",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === "list") {
      const templates = await db
        .select()
        .from(schema.messageTemplates)
        .where(eq(schema.messageTemplates.guildId, message.guild.id));

      if (templates.length === 0) {
        return void message.reply({ embeds: [infoEmbed("No Templates", "No templates exist yet. Create one with `.template create <name> <content>`")] });
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle("📋 Message Templates")
        .setDescription(templates.map((t, i) => `**${i + 1}. \`${t.name}\`**\n${t.content.slice(0, 80)}${t.content.length > 80 ? "..." : ""}`).join("\n\n"))
        .setFooter({ text: `${templates.length} template(s) | Variables: {user} {reason} {server} {warnings}` });
      return void message.reply({ embeds: [embed] });
    }

    if (sub === "create") {
      if (!isModerator(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });
      const name = args[1]?.toLowerCase();
      if (!name) return void message.reply({ embeds: [errorEmbed("Missing Name", "Usage: `.template create <name> <content>`")] });
      const content = args.slice(2).join(" ");
      if (!content) return void message.reply({ embeds: [errorEmbed("Missing Content")] });

      const existing = await db.query.messageTemplates.findFirst({
        where: and(eq(schema.messageTemplates.guildId, message.guild.id), eq(schema.messageTemplates.name, name)),
      });

      if (existing) {
        await db.update(schema.messageTemplates)
          .set({ content, updatedAt: new Date() })
          .where(eq(schema.messageTemplates.id, existing.id));
        return void message.reply({ embeds: [successEmbed("Template Updated", `Template \`${name}\` updated.`)] });
      }

      await db.insert(schema.messageTemplates).values({ guildId: message.guild.id, name, content, createdBy: message.author.id });
      return void message.reply({ embeds: [successEmbed("Template Created", `Template \`${name}\` created!\n\nUse \`.template dm @user ${name}\` to send it.`)] });
    }

    if (sub === "delete") {
      if (!isModerator(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });
      const name = args[1]?.toLowerCase();
      if (!name) return void message.reply({ embeds: [errorEmbed("Missing Name")] });
      await db.delete(schema.messageTemplates).where(
        and(eq(schema.messageTemplates.guildId, message.guild.id), eq(schema.messageTemplates.name, name))
      );
      return void message.reply({ embeds: [successEmbed("Template Deleted", `Template \`${name}\` removed.`)] });
    }

    if (sub === "dm") {
      if (!isModerator(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });
      const target = message.mentions.users.first();
      const templateName = args[2]?.toLowerCase();
      if (!target || !templateName) {
        return void message.reply({ embeds: [errorEmbed("Usage", "`.template dm @user <templateName>`")] });
      }
      const tmpl = await db.query.messageTemplates.findFirst({
        where: and(eq(schema.messageTemplates.guildId, message.guild.id), eq(schema.messageTemplates.name, templateName)),
      });
      if (!tmpl) return void message.reply({ embeds: [errorEmbed("Not Found", `Template \`${templateName}\` doesn't exist.`)] });

      const content = tmpl.content.replace("{user}", target.tag).replace("{server}", message.guild.name);
      try {
        await target.send(content);
        return void message.reply({ embeds: [successEmbed("DM Sent", `Template \`${templateName}\` sent to **${target.tag}**.`)] });
      } catch {
        return void message.reply({ embeds: [errorEmbed("DM Failed", "Couldn't DM that user (they may have DMs disabled).")] });
      }
    }

    await message.reply({ embeds: [infoEmbed("Template Help", "Subcommands: `create`, `list`, `delete`, `dm`\n**Variables:** `{user}` `{reason}` `{server}` `{warnings}`")] });
  },
};

export default template;
