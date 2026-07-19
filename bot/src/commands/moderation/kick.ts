import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { isModerator, canModerate } from "../../lib/permissions.js";
import { modEmbed, errorEmbed } from "../../lib/embeds.js";

const kick: Command = {
  name: "kick",
  description: "Kick a member from the server.",
  usage: ".kick @user [reason]",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) {
      return void message.reply({ embeds: [errorEmbed("No Permission", "You need Kick Members permission.")] });
    }

    const target = message.mentions.members?.first();
    if (!target) return void message.reply({ embeds: [errorEmbed("Missing Target")] });
    if (!canModerate(message.member, target)) {
      return void message.reply({ embeds: [errorEmbed("Cannot Moderate", "You cannot kick someone with a higher or equal role.")] });
    }
    if (!target.kickable) return void message.reply({ embeds: [errorEmbed("Cannot Kick", "I don't have permission to kick this user.")] });

    const reason = args.slice(1).join(" ") || "No reason provided";
    try {
      await target.send(`👢 You have been kicked from **${message.guild.name}**.\n**Reason:** ${reason}`);
    } catch {}
    await target.kick(reason);
    await message.reply({ embeds: [modEmbed("Member Kicked", target.user, message.author, reason)] });
  },
};

export default kick;
