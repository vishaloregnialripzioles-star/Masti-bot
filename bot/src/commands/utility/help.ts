import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { COLORS, PREFIX } from "../../config.js";
import { infoEmbed } from "../../lib/embeds.js";

const help: Command = {
  name: "help",
  aliases: ["h", "commands"],
  description: "Show all commands or info about a specific command.",
  usage: ".help [command]",
  category: "info",
  async execute(message: Message, args: string[], _client: Client) {
    const { commands } = await import("../registry.js");

    if (args[0]) {
      const cmd = commands.get(args[0].toLowerCase());
      if (!cmd) return void message.reply({ embeds: [infoEmbed("Command Not Found", `No command named \`${args[0]}\`.`)] });
      const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle(`${PREFIX}${cmd.name}`)
        .setDescription(cmd.description)
        .addFields(
          { name: "Usage", value: `\`${cmd.usage}\``, inline: true },
          { name: "Category", value: cmd.category, inline: true },
        );
      if (cmd.aliases?.length) embed.addFields({ name: "Aliases", value: cmd.aliases.map(a => `\`${a}\``).join(", "), inline: true });
      return void message.reply({ embeds: [embed] });
    }

    const categories: Record<string, Command[]> = {};
    const seen = new Set<string>();
    for (const [, cmd] of commands) {
      if (seen.has(cmd.name)) continue;
      seen.add(cmd.name);
      if (!categories[cmd.category]) categories[cmd.category] = [];
      categories[cmd.category].push(cmd);
    }

    const categoryEmojis: Record<string, string> = {
      moderation: "🔨",
      utility: "🛠️",
      economy: "💰",
      leveling: "⭐",
      info: "ℹ️",
    };

    const embed = new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle("📖 Bot Commands")
      .setDescription(`Prefix: \`${PREFIX}\` — Use \`.help <command>\` for details`)
      .setFooter({ text: `${seen.size} total commands` });

    for (const [cat, cmds] of Object.entries(categories)) {
      embed.addFields({
        name: `${categoryEmojis[cat] ?? "📌"} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
        value: cmds.map(c => `\`${c.name}\``).join(", "),
      });
    }

    await message.reply({ embeds: [embed] });
  },
};

export default help;
