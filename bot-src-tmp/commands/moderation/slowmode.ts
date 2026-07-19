import type { Message, Client } from "discord.js";
import { TextChannel } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../../lib/permissions.js";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";

const slowmode: Command = {
  name: "slowmode",
  aliases: ["slow"],
  description: "Set channel slowmode (0 to disable). e.g. 5s, 1m, 1h",
  usage: ".slowmode <duration|0>",
  category: "moderation",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });

    const input = args[0] ?? "0";
    let seconds = 0;
    const match = input.match(/^(\d+)(s|m|h)?$/i);
    if (!match) return void message.reply({ embeds: [errorEmbed("Invalid Input", "Use: 10s, 5m, 1h, or 0")] });

    const val = parseInt(match[1]);
    switch ((match[2] ?? "s").toLowerCase()) {
      case "s": seconds = val; break;
      case "m": seconds = val * 60; break;
      case "h": seconds = val * 3600; break;
    }

    if (seconds > 21600) return void message.reply({ embeds: [errorEmbed("Too Long", "Max slowmode is 6 hours.")] });

    const channel = message.channel as TextChannel;
    await channel.setRateLimitPerUser(seconds);
    await message.reply({
      embeds: [successEmbed("Slowmode Set", seconds === 0 ? "Slowmode disabled." : `Slowmode set to **${input}**.`)],
    });
  },
};

export default slowmode;
