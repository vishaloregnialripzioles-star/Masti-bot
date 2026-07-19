import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const blockedWords = pgTable("blocked_words", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  word: text("word").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BlockedWord = typeof blockedWords.$inferSelect;
export type InsertBlockedWord = typeof blockedWords.$inferInsert;
