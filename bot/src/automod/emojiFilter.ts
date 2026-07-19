import type { Message } from "discord.js";
import { AUTOMOD_CONFIG } from "../config.js";

const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|<a?:\w+:\d+>)/gu;

export async function checkEmojis(message: Message): Promise<boolean> {
  if (!message.guild) return false;
  const matches = message.content.match(emojiRegex) ?? [];
  if (matches.length <= AUTOMOD_CONFIG.maxEmojisPerMessage) return false;
  if (message.member?.permissions.has("ManageMessages")) return false;

  try { await message.delete(); } catch {}
  try {
    if ("send" in message.channel) {
      const warn = await message.channel.send(`${message.author}, please don't spam emojis.`);
      setTimeout(() => warn.delete().catch(() => {}), 5000);
    }
  } catch {}

  return true;
}
