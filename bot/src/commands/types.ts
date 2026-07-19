import type { Message, Client } from "discord.js";

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  category: "moderation" | "utility" | "economy" | "leveling" | "info";
  staffOnly?: boolean;
  adminOnly?: boolean;
  guildOnly?: boolean;
  execute(message: Message, args: string[], client: Client): Promise<void>;
}
