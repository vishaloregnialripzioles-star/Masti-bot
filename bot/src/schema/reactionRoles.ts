import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const reactionRoles = pgTable("reaction_roles", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  messageId: text("message_id").notNull(),
  emoji: text("emoji").notNull(),
  roleId: text("role_id").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ReactionRole = typeof reactionRoles.$inferSelect;
export type InsertReactionRole = typeof reactionRoles.$inferInsert;
