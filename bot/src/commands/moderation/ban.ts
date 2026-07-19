import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { isModerator, canModerate } from "../../lib/permissions.js";
import { modEmbed, errorEmbed } from "../../lib/embeds.js";

const ban: Command = {
  name: "ban",
  description: "Ban a member from the server.",
  usage: ".ban @user [reason]",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) {
      return void message.reply({ embeds: [errorEmbed("No Permission", "You need Ban Members permission.")] });
    }

    const target = message.mentions.members?.first();
    if (!target) return void message.reply({ embeds: [errorEmbed("Missing Target")] });
    if (!canModerate(message.member, target)) {
      return void message.reply({ embeds: [errorEmbed("Cannot Moderate", "You cannot ban someone with a higher or equal role.")] });
    }
    if (!target.bannable) return void message.reply({ embeds: [errorEmbed("Cannot Ban", "I don't have permission to ban this user.")] });

    const reason = args.slice(1).join(" ") || "No reason provided";
    try {
      await target.send(`🔨 You have been banned from **${message.guild.name}**.\n**Reason:** ${reason}`);
    } catch {}
    await target.ban({ reason, deleteMessageSeconds: 86400 });
    await message.reply({ embeds: [modEmbed("Member Banned", target.user, message.author, reason)] });
  },
};

export default ban;
