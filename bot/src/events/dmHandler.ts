import { Events, type Client, type Message, ChannelType, EmbedBuilder } from "discord.js";
import { db, schema } from "../database.js";
import { eq, and } from "drizzle-orm";
import { COLORS } from "../config.js";
import { logger } from "../lib/logger.js";

export default function registerDmHandler(client: Client) {
  // Note: this handles incoming DMs for modmail.
  // The main messageCreate handler calls this for DM channels.
  (client as any)._handleModmailDm = async (message: Message) => {
    if (message.author.bot) return;
    if (message.channel.type !== ChannelType.DM) return;

    // Find all guilds where this user is a member and modmail is set up
    const guilds = client.guilds.cache;
    for (const [, guild] of guilds) {
      let member;
      try { member = await guild.members.fetch(message.author.id); } catch { continue; }

      const settings = await db.query.guildSettings.findFirst({ where: eq(schema.guildSettings.guildId, guild.id) });
      if (!settings?.modmailChannelId) continue;

      const staffChannel = guild.channels.cache.get(settings.modmailChannelId);
      if (!staffChannel || !("send" in staffChannel)) continue;

      // Find or create thread
      let thread = await db.query.modmailThreads.findFirst({
        where: and(
          eq(schema.modmailThreads.guildId, guild.id),
          eq(schema.modmailThreads.userId, message.author.id),
          eq(schema.modmailThreads.status, "open"),
        ),
      });

      if (!thread) {
        // Create thread channel in the staff channel category, or just post to staff channel
        const embed = new EmbedBuilder()
          .setColor(COLORS.warning)
          .setTitle("📬 New ModMail Thread")
          .setDescription(message.content || "*[No text content]*")
          .setAuthor({ name: `${message.author.tag} (${message.author.id})`, iconURL: message.author.displayAvatarURL() })
          .setFooter({ text: `Reply with .modmail reply <message> in this thread` })
          .setTimestamp();

        const sent = await (staffChannel as any).send({ embeds: [embed] });

        // Save thread referencing the staff channel
        const [newThread] = await db.insert(schema.modmailThreads).values({
          guildId: guild.id,
          userId: message.author.id,
          channelId: settings.modmailChannelId,
          status: "open",
        }).returning();
        thread = newThread;

        // Notify user
        try {
          await message.author.send({ embeds: [new EmbedBuilder()
            .setColor(COLORS.success)
            .setTitle("📬 ModMail Opened")
            .setDescription(`Your message has been sent to the **${guild.name}** staff team. They'll get back to you soon.\n\nKeep replying to this DM to continue the conversation.`)
            .setTimestamp()] });
        } catch {}
      } else {
        // Forward message to staff channel
        const embed = new EmbedBuilder()
          .setColor(COLORS.primary)
          .setDescription(message.content || "*[Attachment]*")
          .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();

        await (staffChannel as any).send({ embeds: [embed] });
      }

      break; // Only handle for the first matching guild
    }
  };
}
