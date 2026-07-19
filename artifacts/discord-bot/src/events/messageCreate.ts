import { Events, type Client, type Message, ChannelType, EmbedBuilder } from "discord.js";
import { db, schema } from "../database.js";
import { eq, and } from "drizzle-orm";
import commands from "../commands/registry.js";
import { PREFIX, XP_CONFIG, ECONOMY_CONFIG } from "../config.js";
import { addXp } from "../lib/xp.js";
import { addCoins } from "../lib/economy.js";
import { checkBlockedWords } from "../automod/blockedWordsFilter.js";
import { checkSpam } from "../automod/spamFilter.js";
import { checkInvites } from "../automod/inviteFilter.js";
import { checkEmojis } from "../automod/emojiFilter.js";
import { checkCaps } from "../automod/capsFilter.js";
import { logger } from "../lib/logger.js";
import { COLORS } from "../config.js";

// XP and coin cooldowns: key = guildId:userId
const xpCooldowns = new Map<string, number>();
const coinCooldowns = new Map<string, number>();

export default function registerMessageCreate(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    // Handle DMs (modmail)
    if (message.channel.type === ChannelType.DM) {
      const handler = (client as any)._handleModmailDm;
      if (typeof handler === "function") {
        await handler(message).catch((e: unknown) => logger.error("ModMail DM error", e));
      }
      return;
    }

    if (!message.guild) return;
    const guildId = message.guild.id;
    const userId = message.author.id;

    // Load settings
    let settings;
    try {
      settings = await db.query.guildSettings.findFirst({ where: eq(schema.guildSettings.guildId, guildId) });
    } catch {}

    // ── AFK check ──────────────────────────────────────────────────────────────
    // If the author is AFK, remove their AFK status
    const authorAfk = await db.query.afkUsers.findFirst({
      where: and(eq(schema.afkUsers.guildId, guildId), eq(schema.afkUsers.userId, userId)),
    }).catch(() => null);

    if (authorAfk) {
      await db.delete(schema.afkUsers).where(eq(schema.afkUsers.id, authorAfk.id)).catch(() => {});
      const pings = (authorAfk.pings as any[]) ?? [];
      if (pings.length > 0) {
        const lines = pings.slice(-10).map((p: any) =>
          `• **${p.pingerName}** <t:${Math.floor(p.timestamp / 1000)}:R> in <#${p.channelId}> — [Jump](https://discord.com/channels/${guildId}/${p.channelId}/${p.messageId})`
        );
        const embed = new EmbedBuilder()
          .setColor(COLORS.info)
          .setTitle("💤 Welcome Back!")
          .setDescription(`You were pinged **${pings.length}** time(s) while AFK:\n\n${lines.join("\n")}`)
          .setFooter({ text: "Your AFK status has been removed" });
        message.reply({ embeds: [embed] }).catch(() => {});
      } else {
        message.reply("👋 Welcome back! Your AFK status has been removed.").catch(() => {});
      }
    }

    // If someone is mentioned and they're AFK, show their AFK message
    if (message.mentions.users.size > 0) {
      for (const [, mentionedUser] of message.mentions.users) {
        if (mentionedUser.id === userId) continue;
        const afkData = await db.query.afkUsers.findFirst({
          where: and(eq(schema.afkUsers.guildId, guildId), eq(schema.afkUsers.userId, mentionedUser.id)),
        }).catch(() => null);

        if (afkData) {
          // Record the ping
          const pings = (afkData.pings as any[]) ?? [];
          pings.push({
            pingerId: userId,
            pingerName: message.author.username,
            messageId: message.id,
            channelId: message.channel.id,
            timestamp: Date.now(),
            content: message.content.slice(0, 100),
          });
          await db.update(schema.afkUsers).set({ pings }).where(eq(schema.afkUsers.id, afkData.id)).catch(() => {});

          const embed = new EmbedBuilder()
            .setColor(COLORS.warning)
            .setDescription(`💤 **${mentionedUser.username}** is AFK: ${afkData.message}`);
          if ("send" in message.channel) {
            message.channel.send({ embeds: [embed] }).catch(() => {});
          }
        }
      }
    }

    // ── Automod (only if not a command) ─────────────────────────────────────
    if (!message.content.startsWith(PREFIX)) {
      // Run automod checks in order; stop on first trigger
      if (settings?.inviteFilterEnabled !== false) {
        if (await checkInvites(message).catch(() => false)) return;
      }
      if (settings?.spamFilterEnabled !== false) {
        if (await checkSpam(message).catch(() => false)) return;
      }
      if (settings?.emojiFilterEnabled !== false) {
        if (await checkEmojis(message).catch(() => false)) return;
      }
      if (settings?.capsFilterEnabled !== false) {
        if (await checkCaps(message).catch(() => false)) return;
      }
      // Always check blocked words
      if (await checkBlockedWords(message).catch(() => false)) return;
    }

    // ── XP & Coins (passive earn) ────────────────────────────────────────────
    const cooldownKey = `${guildId}:${userId}`;
    const now = Date.now();

    if (settings?.xpEnabled !== false) {
      const lastXp = xpCooldowns.get(cooldownKey) ?? 0;
      if (now - lastXp >= XP_CONFIG.cooldownMs) {
        xpCooldowns.set(cooldownKey, now);
        const xpGain = Math.floor(Math.random() * (XP_CONFIG.maxPerMessage - XP_CONFIG.minPerMessage + 1)) + XP_CONFIG.minPerMessage;
        try {
          const result = await addXp(guildId, userId, xpGain);
          if (result.leveledUp) {
            // Announce level up
            const announceEmbed = new EmbedBuilder()
              .setColor(COLORS.purple)
              .setDescription(`🎉 ${message.author} leveled up to **Level ${result.newLevel}**! ⭐`);
            if ("send" in message.channel) {
              message.channel.send({ embeds: [announceEmbed] }).catch(() => {});
            }

            // Award level roles
            const levelRoleRows = await db.select().from(schema.levelRoles)
              .where(and(eq(schema.levelRoles.guildId, guildId), eq(schema.levelRoles.level, result.newLevel)));
            for (const lr of levelRoleRows) {
              const role = message.guild.roles.cache.get(lr.roleId);
              if (role && message.member) {
                message.member.roles.add(role).catch(() => {});
              }
            }
          }
        } catch (e) {
          logger.error("XP award error", e);
        }
      }
    }

    if (settings?.economyEnabled !== false) {
      const lastCoin = coinCooldowns.get(cooldownKey) ?? 0;
      if (now - lastCoin >= ECONOMY_CONFIG.earnCooldownMs) {
        coinCooldowns.set(cooldownKey, now);
        const coinGain = Math.floor(Math.random() * (ECONOMY_CONFIG.maxEarnPerMessage - ECONOMY_CONFIG.minEarnPerMessage + 1)) + ECONOMY_CONFIG.minEarnPerMessage;
        addCoins(guildId, userId, coinGain).catch(() => {});
      }
    }

    // ── Command Handler ──────────────────────────────────────────────────────
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args, client);
    } catch (e) {
      logger.error(`Command "${commandName}" error:`, e);
      message.reply("❌ An error occurred while running that command.").catch(() => {});
    }
  });
}
