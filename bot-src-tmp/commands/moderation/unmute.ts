import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { isModerator, canModerate } from "../../lib/permissions.js";
import { modEmbed, errorEmbed } from "../../lib/embeds.js";

const unmute: Command = {
  name: "unmute",
  aliases: ["untimeout"],
  description: "Remove timeout from a member.",
  usage: ".unmute @user [reason]",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });

    const target = message.mentions.members?.first();
    if (!target) return void message.reply({ embeds: [errorEmbed("Missing Target")] });
    if (!canModerate(message.member, target)) return void message.reply({ embeds: [errorEmbed("Cannot Moderate")] });

    const reason = args.slice(1).join(" ") || "No reason provided";
    await target.timeout(null, reason);
    await message.reply({ embeds: [modEmbed("Member Unmuted", target.user, message.author, reason)] });
  },
};

export default unmute;
