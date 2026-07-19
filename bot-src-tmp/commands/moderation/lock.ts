import type { Message, Client } from "discord.js";
import { TextChannel, PermissionFlagsBits } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../../lib/permissions.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const lock: Command = {
  name: "lock",
  description: "Lock the current channel so @everyone cannot send messages.",
  usage: ".lock [reason]",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });

    const channel = message.channel as TextChannel;
    const reason = args.join(" ") || "Channel locked by moderator";
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }, { reason });
    await message.reply({ embeds: [successEmbed("Channel Locked", `🔒 **${channel.name}** has been locked.\n**Reason:** ${reason}`)] });
  },
};

export default lock;
