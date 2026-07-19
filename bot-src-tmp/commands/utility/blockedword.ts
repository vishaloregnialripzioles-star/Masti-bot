import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { isModerator } from "../../lib/permissions.js";
import { successEmbed, errorEmbed, infoEmbed } from "../../lib/embeds.js";
import { COLORS } from "../../config.js";

const blockedword: Command = {
  name: "blockedword",
  aliases: ["bw", "blockedwords"],
  description: "Manage blocked words. Subcommands: add, remove, list",
  usage: ".blockedword <add|remove|list> [word]",
  category: "utility",
  staffOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isModerator(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission")] });

    const sub = args[0]?.toLowerCase();

    if (!sub || sub === "list") {
      const words = await db
        .select()
        .from(schema.blockedWords)
        .where(eq(schema.blockedWords.guildId, message.guild.id));

      if (words.length === 0) {
        return void message.reply({ embeds: [infoEmbed("No Blocked Words", "Add some with `.blockedword add <word>`")] });
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle("🚫 Blocked Words")
        .setDescription(words.map(w => `\`${w.word}\``).join(", "))
        .setFooter({ text: `${words.length} word(s) blocked` });
      return void message.reply({ embeds: [embed] });
    }

    if (sub === "add") {
      const word = args[1]?.toLowerCase();
      if (!word) return void message.reply({ embeds: [errorEmbed("Missing Word")] });

      const existing = await db.query.blockedWords.findFirst({
        where: and(eq(schema.blockedWords.guildId, message.guild.id), eq(schema.blockedWords.word, word)),
      });
      if (existing) return void message.reply({ embeds: [errorEmbed("Already Blocked", `\`${word}\` is already blocked.`)] });

      await db.insert(schema.blockedWords).values({ guildId: message.guild.id, word, createdBy: message.author.id });
      return void message.reply({ embeds: [successEmbed("Word Blocked", `\`${word}\` has been added to the blocked list.\n\nMessages containing this word will be deleted and the user will receive a warn DM.`)] });
    }

    if (sub === "remove") {
      const word = args[1]?.toLowerCase();
      if (!word) return void message.reply({ embeds: [errorEmbed("Missing Word")] });

      await db.delete(schema.blockedWords).where(
        and(eq(schema.blockedWords.guildId, message.guild.id), eq(schema.blockedWords.word, word))
      );
      return void message.reply({ embeds: [successEmbed("Word Unblocked", `\`${word}\` removed from blocked list.`)] });
    }

    await message.reply({ embeds: [infoEmbed("Blocked Words Help", "`.blockedword add <word>` — block a word\n`.blockedword remove <word>` — unblock a word\n`.blockedword list` — see all blocked words")] });
  },
};

export default blockedword;
