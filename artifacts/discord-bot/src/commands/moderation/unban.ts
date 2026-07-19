import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../../lib/permissions.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const unban: Command = {
  name: "unban",
  description: "Unban a user by their ID.",
  usage: ".unban <userId> [reason]",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) {
      return void message.reply({ embeds: [errorEmbed("No Permission")] });
    }

    const userId = args[0];
    if (!userId) return void message.reply({ embeds: [errorEmbed("Missing User ID", "Provide the user ID to unban.")] });

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await message.guild.bans.remove(userId, reason);
      await message.reply({ embeds: [successEmbed("User Unbanned", `User \`${userId}\` has been unbanned.\n**Reason:** ${reason}`)] });
    } catch {
      await message.reply({ embeds: [errorEmbed("Unban Failed", "That user is not banned or the ID is invalid.")] });
    }
  },
};

export default unban;
