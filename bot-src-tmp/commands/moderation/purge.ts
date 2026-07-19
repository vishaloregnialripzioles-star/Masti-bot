import type { Message, Client } from "discord.js";
import { TextChannel } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../../lib/permissions.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const purge: Command = {
  name: "purge",
  aliases: ["clear", "prune"],
  description: "Delete a number of messages from the channel (1-100).",
  usage: ".purge <amount> [@user]",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return void message.reply({ embeds: [errorEmbed("Invalid Amount", "Please provide a number between 1 and 100.")] });
    }

    const targetUser = message.mentions.users.first();
    await message.delete().catch(() => {});

    const channel = message.channel as TextChannel;
    let messages = await channel.messages.fetch({ limit: 100 });

    if (targetUser) {
      messages = messages.filter(m => m.author.id === targetUser.id);
    }

    // Filter out messages older than 14 days
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);
    const toDelete = [...messages.values()].slice(0, amount);

    if (toDelete.length === 0) {
      return void channel.send({ embeds: [errorEmbed("No Messages", "No eligible messages found (messages must be under 14 days old).")] }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const deleted = await channel.bulkDelete(toDelete, true);
    const confirm = await channel.send({ embeds: [successEmbed("Messages Purged", `Deleted **${deleted.size}** messages${targetUser ? ` from ${targetUser.tag}` : ""}.`)] });
    setTimeout(() => confirm.delete().catch(() => {}), 5000);
  },
};

export default purge;
