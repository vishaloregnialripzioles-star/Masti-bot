import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;
