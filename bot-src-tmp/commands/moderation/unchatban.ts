import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { isModerator } from "../../lib/permissions.js";
import { modEmbed, errorEmbed } from "../../lib/embeds.js";

const unchatban: Command = {
  name: "unchatban",
  aliases: ["uncb"],
  description: "Restore a member's ability to send messages.",
  usage: ".unchatban @user [reason]",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });

    const target = message.mentions.members?.first();
    if (!target) return void message.reply({ embeds: [errorEmbed("Missing Target")] });

    const reason = args.slice(1).join(" ") || "No reason provided";
    const settings = await db.query.guildSettings.findFirst({ where: eq(schema.guildSettings.guildId, message.guild.id) });

    if (settings?.chatbanRoleId) {
      const role = message.guild.roles.cache.get(settings.chatbanRoleId);
      if (role && target.roles.cache.has(role.id)) {
        await target.roles.remove(role, reason);
        return void message.reply({ embeds: [modEmbed("Chat-Ban Removed", target.user, message.author, reason)] });
      }
    }

    // Remove channel overrides
    for (const [, channel] of message.guild.channels.cache) {
      if (channel.isTextBased() && "permissionOverwrites" in channel) {
        try {
          await channel.permissionOverwrites.delete(target.id, reason);
        } catch {}
      }
    }

    await message.reply({ embeds: [modEmbed("Chat-Ban Removed", target.user, message.author, reason)] });
  },
};

export default unchatban;
