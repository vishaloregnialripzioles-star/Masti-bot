import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { isAdmin } from "../../lib/permissions.js";
import { successEmbed, errorEmbed, infoEmbed } from "../../lib/embeds.js";
import { COLORS } from "../../config.js";

const reactionrole: Command = {
  name: "reactionrole",
  aliases: ["rr"],
  description: "Manage reaction roles. Subcommands: add, remove, list",
  usage: ".reactionrole <add|remove|list> [args]",
  category: "utility",
  adminOnly: true,
  async execute(message: Message, args: string[], client: Client) {
    if (!message.guild || !message.member) return;
    if (!isAdmin(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission", "Only admins can manage reaction roles.")] });

    const sub = args[0]?.toLowerCase();

    if (sub === "add") {
      // .rr add #channel <messageId> <emoji> @role [description]
      const channel = message.mentions.channels.first();
      const msgId = args[2];
      const emoji = args[3];
      const role = message.mentions.roles.first();
      if (!channel || !msgId || !emoji || !role) {
        return void message.reply({ embeds: [errorEmbed("Usage", "`.reactionrole add #channel <messageId> <emoji> @role`")] });
      }

      if (!("messages" in channel)) return void message.reply({ embeds: [errorEmbed("Invalid Channel")] });

      try {
        const targetMsg = await (channel as any).messages.fetch(msgId);
        await targetMsg.react(emoji);
      } catch {
        return void message.reply({ embeds: [errorEmbed("Failed", "Couldn't find the message or react with that emoji.")] });
      }

      const description = args.slice(5).join(" ") || undefined;
      await db.insert(schema.reactionRoles).values({
        guildId: message.guild.id,
        channelId: channel.id,
        messageId: msgId,
        emoji,
        roleId: role.id,
        description,
        createdBy: message.author.id,
      });

      return void message.reply({ embeds: [successEmbed("Reaction Role Added", `Reacting with ${emoji} on that message will give users the **${role.name}** role.`)] });
    }

    if (sub === "remove") {
      const msgId = args[1];
      const emoji = args[2];
      if (!msgId || !emoji) return void message.reply({ embeds: [errorEmbed("Usage", "`.reactionrole remove <messageId> <emoji>`")] });

      await db.delete(schema.reactionRoles).where(
        and(
          eq(schema.reactionRoles.guildId, message.guild.id),
          eq(schema.reactionRoles.messageId, msgId),
          eq(schema.reactionRoles.emoji, emoji),
        )
      );
      return void message.reply({ embeds: [successEmbed("Reaction Role Removed")] });
    }

    if (!sub || sub === "list") {
      const rrs = await db.select().from(schema.reactionRoles).where(eq(schema.reactionRoles.guildId, message.guild.id));
      if (rrs.length === 0) return void message.reply({ embeds: [infoEmbed("No Reaction Roles")] });

      const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle("🎭 Reaction Roles")
        .setDescription(rrs.map(r => `${r.emoji} → <@&${r.roleId}> in <#${r.channelId}>${r.description ? ` — ${r.description}` : ""}`).join("\n"))
        .setFooter({ text: `${rrs.length} reaction role(s)` });
      return void message.reply({ embeds: [embed] });
    }

    await message.reply({ embeds: [infoEmbed("Reaction Role Help", "`.rr add #channel <msgId> <emoji> @role`\n`.rr remove <msgId> <emoji>`\n`.rr list`")] });
  },
};

export default reactionrole;
