import type { Message } from "discord.js";
import { AUTOMOD_CONFIG } from "../config.js";

export async function checkInvites(message: Message): Promise<boolean> {
  if (!message.guild) return false;
  if (!AUTOMOD_CONFIG.inviteRegex.test(message.content)) return false;

  // Allow bots and users with admin/manage server
  if (message.member?.permissions.has("ManageGuild")) return false;

  try { await message.delete(); } catch {}
  try {
    await message.author.send(`🔗 Discord invite links are not allowed in **${message.guild.name}**.`);
  } catch {}

  return true;
}
