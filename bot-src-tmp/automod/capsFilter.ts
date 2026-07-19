import type { Message } from "discord.js";
import { AUTOMOD_CONFIG } from "../config.js";

export async function checkCaps(message: Message): Promise<boolean> {
  if (!message.guild) return false;
  const text = message.content.replace(/[^a-zA-Z]/g, "");
  if (text.length < AUTOMOD_CONFIG.minCapsLengthToCheck) return false;
  if (message.member?.permissions.has("ManageMessages")) return false;

  const uppercase = text.replace(/[^A-Z]/g, "").length;
  const pct = (uppercase / text.length) * 100;
  if (pct < AUTOMOD_CONFIG.capsThresholdPercent) return false;

  try { await message.delete(); } catch {}
  try {
    if ("send" in message.channel) {
      const warn = await message.channel.send(`${message.author}, please don't use excessive caps.`);
      setTimeout(() => warn.delete().catch(() => {}), 5000);
    }
  } catch {}

  return true;
}
