import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const warnings = pgTable("warnings", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  moderatorId: text("moderator_id").notNull(),
  reason: text("reason").notNull().default("No reason provided"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Warning = typeof warnings.$inferSelect;
export type InsertWarning = typeof warnings.$inferInsert;
