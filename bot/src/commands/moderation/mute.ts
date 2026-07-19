import type { Message, Client } from "discord.js";
import type { Command } from "../types.js";
import { isModerator, canModerate } from "../../lib/permissions.js";
import { modEmbed, errorEmbed, successEmbed } from "../../lib/embeds.js";

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const val = parseInt(match[1]);
  switch (match[2].toLowerCase()) {
    case "s": return val * 1000;
    case "m": return val * 60 * 1000;
    case "h": return val * 60 * 60 * 1000;
    case "d": return val * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

const mute: Command = {
  name: "mute",
  aliases: ["timeout"],
  description: "Timeout (mute) a member. Duration: 10s, 5m, 2h, 1d",
  usage: ".mute @user <duration> [reason]",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) {
      return void message.reply({ embeds: [errorEmbed("No Permission")] });
    }

    const target = message.mentions.members?.first();
    if (!target) return void message.reply({ embeds: [errorEmbed("Missing Target")] });
    if (!canModerate(message.member, target)) {
      return void message.reply({ embeds: [errorEmbed("Cannot Moderate")] });
    }

    const durationStr = args[1] ?? "10m";
    const durationMs = parseDuration(durationStr) ?? 10 * 60 * 1000;
    const reason = args.slice(2).join(" ") || "No reason provided";

    if (durationMs > 28 * 24 * 60 * 60 * 1000) {
      return void message.reply({ embeds: [errorEmbed("Duration Too Long", "Maximum timeout is 28 days.")] });
    }

    try {
      await target.timeout(durationMs, reason);
      try { await target.send(`🔇 You have been muted in **${message.guild.name}** for ${durationStr}.\n**Reason:** ${reason}`); } catch {}
      await message.reply({ embeds: [modEmbed("Member Muted", target.user, message.author, reason, { Duration: durationStr })] });
    } catch {
      await message.reply({ embeds: [errorEmbed("Failed to Mute", "I couldn't timeout that member.")] });
    }
  },
};

export default mute;
