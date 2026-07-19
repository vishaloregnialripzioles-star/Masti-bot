import type { Message, Client } from "discord.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { successEmbed, errorEmbed } from "../../lib/embeds.js";
import { COLORS } from "../../config.js";

export interface AfkPing {
  pingerId: string;
  pingerName: string;
  messageId: string;
  channelId: string;
  timestamp: number;
  content: string;
}

const afk: Command = {
  name: "afk",
  description: "Set an AFK message. You'll be notified of pings while away.",
  usage: ".afk [message]",
  category: "utility",
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild) return;

    const afkMessage = args.join(" ") || "AFK";

    const existing = await db.query.afkUsers.findFirst({
      where: and(eq(schema.afkUsers.guildId, message.guild.id), eq(schema.afkUsers.userId, message.author.id)),
    });

    if (existing) {
      await db.update(schema.afkUsers)
        .set({ message: afkMessage, pings: [], createdAt: new Date() })
        .where(eq(schema.afkUsers.id, existing.id));
    } else {
      await db.insert(schema.afkUsers).values({
        guildId: message.guild.id,
        userId: message.author.id,
        message: afkMessage,
        pings: [],
      });
    }

    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle("💤 AFK Set")
        .setDescription(`You're now AFK: **${afkMessage}**\nI'll record anyone who pings you and show them when you return.`)],
    });
  },
};

export default afk;
