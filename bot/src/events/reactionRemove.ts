import { Events, type Client, type MessageReaction, type User, PartialMessageReaction, PartialUser } from "discord.js";
import { db, schema } from "../database.js";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger.js";

export default function registerReactionRemove(client: Client) {
  client.on(Events.MessageReactionRemove, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    if (user.bot) return;
    if (!reaction.message.guild) return;

    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
    } catch { return; }

    const guildId = reaction.message.guild.id;
    const messageId = reaction.message.id;
    const emoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name ?? "";

    const rr = await db.query.reactionRoles.findFirst({
      where: and(
        eq(schema.reactionRoles.guildId, guildId),
        eq(schema.reactionRoles.messageId, messageId),
        eq(schema.reactionRoles.emoji, emoji),
      ),
    });

    if (!rr) return;

    try {
      const guild = reaction.message.guild;
      const member = await guild.members.fetch(user.id);
      const role = guild.roles.cache.get(rr.roleId);
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
      }
    } catch (e) {
      logger.error("Reaction role remove error", e);
    }
  });
}
