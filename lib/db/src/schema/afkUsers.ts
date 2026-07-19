import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";

export const afkUsers = pgTable("afk_users", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  message: text("message").notNull().default("AFK"),
  pings: jsonb("pings").default([]).notNull(), // Array of {pingerId, pingerName, messageId, channelId, timestamp, content}
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AfkUser = typeof afkUsers.$inferSelect;
export type InsertAfkUser = typeof afkUsers.$inferInsert;
