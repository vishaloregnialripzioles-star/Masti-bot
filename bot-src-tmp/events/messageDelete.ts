import { Events, type Client, type Message, type PartialMessage } from "discord.js";
import { logger } from "../lib/logger.js";

export interface SnipeData {
  content: string;
  authorTag: string;
  authorAvatar: string;
  authorId: string;
  deletedAt: number;
  imageUrl?: string;
}

// In-memory snipe cache: channelId → last deleted message
export const snipeCache = new Map<string, SnipeData>();

export default function registerMessageDelete(client: Client) {
  client.on(Events.MessageDelete, (message: Message | PartialMessage) => {
    if (!message.guild || message.author?.bot) return;
    if (!message.content && message.attachments.size === 0) return;

    const imageAttachment = message.attachments.find(a =>
      a.contentType?.startsWith("image/") ?? false
    );

    snipeCache.set(message.channel.id, {
      content: message.content ?? "",
      authorTag: message.author?.tag ?? "Unknown",
      authorAvatar: message.author?.displayAvatarURL() ?? "",
      authorId: message.author?.id ?? "",
      deletedAt: Date.now(),
      imageUrl: imageAttachment?.url,
    });

    // Auto-expire after 5 minutes
    setTimeout(() => {
      const current = snipeCache.get(message.channel.id);
      if (current && current.deletedAt === snipeCache.get(message.channel.id)?.deletedAt) {
        snipeCache.delete(message.channel.id);
      }
    }, 5 * 60 * 1000);
  });
}
