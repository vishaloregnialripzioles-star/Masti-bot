import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const modmailThreads = pgTable("modmail_threads", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  channelId: text("channel_id").notNull(),
  status: text("status").notNull().default("open"), // open, closed
  closedBy: text("closed_by"),
  closedReason: text("closed_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export type ModmailThread = typeof modmailThreads.$inferSelect;
export type InsertModmailThread = typeof modmailThreads.$inferInsert;
