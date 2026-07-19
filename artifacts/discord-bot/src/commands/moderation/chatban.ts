import type { Message, Client } from "discord.js";
import { PermissionsBitField } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { isModerator, canModerate } from "../../lib/permissions.js";
import { modEmbed, errorEmbed } from "../../lib/embeds.js";

const chatban: Command = {
  name: "chatban",
  aliases: ["cb"],
  description: "Remove a member's ability to send messages in the server.",
  usage: ".chatban @user [reason]",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });

    const target = message.mentions.members?.first();
    if (!target) return void message.reply({ embeds: [errorEmbed("Missing Target")] });
    if (!canModerate(message.member, target)) return void message.reply({ embeds: [errorEmbed("Cannot Moderate")] });

    const reason = args.slice(1).join(" ") || "No reason provided";

    const settings = await db.query.guildSettings.findFirst({ where: eq(schema.guildSettings.guildId, message.guild.id) });

    if (settings?.chatbanRoleId) {
      const role = message.guild.roles.cache.get(settings.chatbanRoleId);
      if (role) {
        await target.roles.add(role, reason);
        try { await target.send(`🚫 You have been chat-banned in **${message.guild.name}**.\n**Reason:** ${reason}`); } catch {}
        return void message.reply({ embeds: [modEmbed("Member Chat-Banned", target.user, message.author, reason)] });
      }
    }

    // Fallback: deny SendMessages in all text channels
    for (const [, channel] of message.guild.channels.cache) {
      if (channel.isTextBased() && "permissionOverwrites" in channel) {
        try {
          await channel.permissionOverwrites.create(target.id, { SendMessages: false }, { reason });
        } catch {}
      }
    }

    try { await target.send(`🚫 You have been chat-banned in **${message.guild.name}**.\n**Reason:** ${reason}`); } catch {}
    await message.reply({ embeds: [modEmbed("Member Chat-Banned", target.user, message.author, reason)] });
  },
};

export default chatban;
