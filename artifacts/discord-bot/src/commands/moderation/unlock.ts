import type { Message, Client } from "discord.js";
import { TextChannel } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../../lib/permissions.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const unlock: Command = {
  name: "unlock",
  description: "Unlock the current channel.",
  usage: ".unlock [reason]",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });

    const channel = message.channel as TextChannel;
    const reason = args.join(" ") || "Channel unlocked by moderator";
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }, { reason });
    await message.reply({ embeds: [successEmbed("Channel Unlocked", `🔓 **${channel.name}** has been unlocked.`)] });
  },
};

export default unlock;
