import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const levelRoles = pgTable("level_roles", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  level: integer("level").notNull(),
  roleId: text("role_id").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LevelRole = typeof levelRoles.$inferSelect;
export type InsertLevelRole = typeof levelRoles.$inferInsert;
