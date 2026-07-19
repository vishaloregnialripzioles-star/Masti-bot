import { EmbedBuilder, User, type ColorResolvable } from "discord.js";
import { COLORS } from "../config.js";

export function successEmbed(title: string, description?: string) {
  const e = new EmbedBuilder().setColor(COLORS.success as ColorResolvable).setTitle(`✅ ${title}`);
  if (description) e.setDescription(description);
  return e;
}

export function errorEmbed(title: string, description?: string) {
  const e = new EmbedBuilder().setColor(COLORS.error as ColorResolvable).setTitle(`❌ ${title}`);
  if (description) e.setDescription(description);
  return e;
}

export function warningEmbed(title: string, description?: string) {
  const e = new EmbedBuilder().setColor(COLORS.warning as ColorResolvable).setTitle(`⚠️ ${title}`);
  if (description) e.setDescription(description);
  return e;
}

export function infoEmbed(title: string, description?: string) {
  const e = new EmbedBuilder().setColor(COLORS.primary as ColorResolvable).setTitle(`ℹ️ ${title}`);
  if (description) e.setDescription(description);
  return e;
}

export function modEmbed(action: string, target: User, moderator: User, reason: string, extra?: Record<string, string>) {
  const e = new EmbedBuilder()
    .setColor(COLORS.error as ColorResolvable)
    .setTitle(`🔨 ${action}`)
    .addFields(
      { name: "Target", value: `${target.tag} (${target.id})`, inline: true },
      { name: "Moderator", value: `${moderator.tag}`, inline: true },
      { name: "Reason", value: reason },
    )
    .setThumbnail(target.displayAvatarURL())
    .setTimestamp();
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      e.addFields({ name: k, value: v, inline: true });
    }
  }
  return e;
}
