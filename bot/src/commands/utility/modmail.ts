import type { Message, Client } from "discord.js";
import { EmbedBuilder, ChannelType, PermissionFlagsBits } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq, and } from "drizzle-orm";
import { isAdmin } from "../../lib/permissions.js";
import { successEmbed, errorEmbed, infoEmbed } from "../../lib/embeds.js";
import { COLORS } from "../../config.js";

const modmail: Command = {
  name: "modmail",
  aliases: ["mm"],
  description: "Modmail system. Setup: `.modmail setup #channel`. Close: `.modmail close`",
  usage: ".modmail <setup|close|reply> [args]",
  category: "utility",
  async execute(message: Message, args: string[], client: Client) {
    if (!message.guild || !message.member) return;
    const sub = args[0]?.toLowerCase();

    if (sub === "setup") {
      if (!isAdmin(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission", "Only admins can set up modmail.")] });
      const channel = message.mentions.channels.first();
      if (!channel) return void message.reply({ embeds: [errorEmbed("Missing Channel", "Mention the staff channel.")] });

      await db.insert(schema.guildSettings).values({
        guildId: message.guild.id,
        modmailChannelId: channel.id,
      }).onConflictDoUpdate({
        target: schema.guildSettings.guildId,
        set: { modmailChannelId: channel.id, updatedAt: new Date() },
      });

      return void message.reply({ embeds: [successEmbed("Modmail Setup", `Modmail enabled! Members can DM me to contact staff. Messages will be relayed to ${channel}.`)] });
    }

    if (sub === "close") {
      const thread = await db.query.modmailThreads.findFirst({
        where: and(
          eq(schema.modmailThreads.guildId, message.guild.id),
          eq(schema.modmailThreads.channelId, message.channel.id),
          eq(schema.modmailThreads.status, "open"),
        ),
      });
      if (!thread) return void message.reply({ embeds: [errorEmbed("Not a Modmail Thread", "This isn't an open modmail thread.")] });

      await db.update(schema.modmailThreads).set({ status: "closed", closedBy: message.author.id, closedAt: new Date() }).where(eq(schema.modmailThreads.id, thread.id));

      try {
        const user = await client.users.fetch(thread.userId);
        await user.send({ embeds: [new EmbedBuilder().setColor(COLORS.info).setTitle("📬 ModMail Closed").setDescription(`Your modmail thread in **${message.guild.name}** has been closed by staff. Feel free to DM me again if you have more concerns.`)] });
      } catch {}

      return void message.reply({ embeds: [successEmbed("Thread Closed", "Modmail thread closed. The user has been notified.")] });
    }

    if (sub === "reply") {
      const thread = await db.query.modmailThreads.findFirst({
        where: and(
          eq(schema.modmailThreads.guildId, message.guild.id),
          eq(schema.modmailThreads.channelId, message.channel.id),
          eq(schema.modmailThreads.status, "open"),
        ),
      });
      if (!thread) return void message.reply({ embeds: [errorEmbed("Not a Modmail Thread")] });

      const replyContent = args.slice(1).join(" ");
      if (!replyContent) return void message.reply({ embeds: [errorEmbed("Missing Message")] });

      try {
        const user = await client.users.fetch(thread.userId);
        await user.send({
          embeds: [new EmbedBuilder()
            .setColor(COLORS.primary)
            .setTitle(`📬 Reply from ${message.guild.name} Staff`)
            .setDescription(replyContent)
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setTimestamp()],
        });
        await message.reply({ embeds: [successEmbed("Reply Sent", `Your reply was sent to the user.`)] });
      } catch {
        await message.reply({ embeds: [errorEmbed("Failed to Send", "Couldn't DM the user.")] });
      }
      return;
    }

    await message.reply({ embeds: [infoEmbed("Modmail", "`.modmail setup #channel` — set staff channel\n`.modmail close` — close thread\n`.modmail reply <message>` — reply to user\n\nUsers DM the bot to open a thread.")] });
  },
};

export default modmail;
