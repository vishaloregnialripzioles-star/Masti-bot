import type { Message, Client } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { db, schema } from "../../database.js";
import { eq } from "drizzle-orm";
import { isAdmin } from "../../lib/permissions.js";
import { successEmbed, errorEmbed, infoEmbed } from "../../lib/embeds.js";
import { COLORS } from "../../config.js";

const setup: Command = {
  name: "setup",
  description: "Configure bot settings. `.setup view` to see current config.",
  usage: ".setup <setting> <value>",
  category: "utility",
  adminOnly: true,
  async execute(message: Message, args: string[], _client: Client) {
    if (!message.guild || !message.member) return;
    if (!isAdmin(message.member)) return void message.reply({ embeds: [errorEmbed("No Permission", "Only admins can run setup.")] });

    const sub = args[0]?.toLowerCase();
    const guildId = message.guild.id;

    const upsert = async (data: Record<string, unknown>) => {
      await db.insert(schema.guildSettings).values({ guildId, ...data } as any).onConflictDoUpdate({
        target: schema.guildSettings.guildId,
        set: { ...data, updatedAt: new Date() },
      });
    };

    if (!sub || sub === "view") {
      const settings = await db.query.guildSettings.findFirst({ where: eq(schema.guildSettings.guildId, guildId) });
      const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle(`⚙️ Bot Setup — ${message.guild.name}`)
        .addFields(
          { name: "📬 ModMail Channel", value: settings?.modmailChannelId ? `<#${settings.modmailChannelId}>` : "Not set", inline: true },
          { name: "📝 Log Channel", value: settings?.logChannelId ? `<#${settings.logChannelId}>` : "Not set", inline: true },
          { name: "👮 Staff Role", value: settings?.staffRoleId ? `<@&${settings.staffRoleId}>` : "Not set", inline: true },
          { name: "🔇 Mute Role", value: settings?.muteRoleId ? `<@&${settings.muteRoleId}>` : "Not set", inline: true },
          { name: "🚫 ChatBan Role", value: settings?.chatbanRoleId ? `<@&${settings.chatbanRoleId}>` : "Not set", inline: true },
          { name: "🏆 Leaderboard", value: settings?.leaderboardEnabled ? `Enabled → <#${settings.leaderboardChannelId ?? "?"}>` : "Disabled", inline: true },
          { name: "🛡️ Spam Filter", value: settings?.spamFilterEnabled ? "✅" : "❌", inline: true },
          { name: "😄 Emoji Filter", value: settings?.emojiFilterEnabled ? "✅" : "❌", inline: true },
          { name: "🔠 Caps Filter", value: settings?.capsFilterEnabled ? "✅" : "❌", inline: true },
          { name: "🔗 Invite Filter", value: settings?.inviteFilterEnabled ? "✅" : "❌", inline: true },
          { name: "⭐ XP Enabled", value: settings?.xpEnabled ? "✅" : "❌", inline: true },
          { name: "💰 Economy Enabled", value: settings?.economyEnabled ? "✅" : "❌", inline: true },
        )
        .setFooter({ text: "Use .setup <setting> <value> to change settings" });
      return void message.reply({ embeds: [embed] });
    }

    const settingMap: Record<string, string> = {
      modmail: "modmailChannelId",
      log: "logChannelId",
      staffrole: "staffRoleId",
      muterole: "muteRoleId",
      chatbanrole: "chatbanRoleId",
      leaderboardchannel: "leaderboardChannelId",
    };
    const toggleMap: Record<string, string> = {
      spamfilter: "spamFilterEnabled",
      emojifilter: "emojiFilterEnabled",
      capsfilter: "capsFilterEnabled",
      invitefilter: "inviteFilterEnabled",
      xp: "xpEnabled",
      economy: "economyEnabled",
      leaderboard: "leaderboardEnabled",
    };

    if (settingMap[sub]) {
      const channel = message.mentions.channels.first();
      const role = message.mentions.roles.first();
      const val = channel?.id ?? role?.id ?? args[1];
      if (!val) return void message.reply({ embeds: [errorEmbed("Missing Value")] });
      await upsert({ [settingMap[sub]]: val });
      return void message.reply({ embeds: [successEmbed("Setting Updated", `**${sub}** set successfully.`)] });
    }

    if (toggleMap[sub]) {
      const val = args[1]?.toLowerCase();
      const enabled = val === "on" || val === "true" || val === "enable";
      await upsert({ [toggleMap[sub]]: enabled });
      return void message.reply({ embeds: [successEmbed("Setting Updated", `**${sub}** is now **${enabled ? "enabled" : "disabled"}**.`)] });
    }

    await message.reply({ embeds: [infoEmbed("Setup Help",
      "**Channel/Role settings:** `modmail #channel`, `log #channel`, `staffrole @role`, `muterole @role`, `chatbanrole @role`, `leaderboardchannel #channel`\n\n" +
      "**Toggles (on/off):** `spamfilter`, `emojifilter`, `capsfilter`, `invitefilter`, `xp`, `economy`, `leaderboard`\n\n" +
      "Example: `.setup spamfilter on` or `.setup modmail #staff-modmail`"
    )] });
  },
};

export default setup;
