import { pgTable, text, integer, timestamp, bigint } from "drizzle-orm/pg-core";

export const userXp = pgTable("user_xp", {
  id: text("id").primaryKey(), // guildId:userId
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  xp: integer("xp").default(0).notNull(),
  level: integer("level").default(0).notNull(),
  totalXp: bigint("total_xp", { mode: "number" }).default(0).notNull(),
  lastMessageAt: timestamp("last_message_at"),
  lastVoiceAt: timestamp("last_voice_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserXp = typeof userXp.$inferSelect;
export type InsertUserXp = typeof userXp.$inferInsert;
