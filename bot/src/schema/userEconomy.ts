import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const userEconomy = pgTable("user_economy", {
  id: text("id").primaryKey(), // guildId:userId
  guildId: text("guild_id").notNull(),
  userId: text("user_id").notNull(),
  coins: integer("coins").default(0).notNull(),
  bank: integer("bank").default(0).notNull(),
  lastDailyAt: timestamp("last_daily_at"),
  lastEarnAt: timestamp("last_earn_at"),
  petName: text("pet_name"),
  petType: text("pet_type").default("cat"),
  petLevel: integer("pet_level").default(0).notNull(),
  petHunger: integer("pet_hunger").default(100).notNull(),
  petHappiness: integer("pet_happiness").default(100).notNull(),
  petLastFedAt: timestamp("pet_last_fed_at"),
  inventory: jsonb("inventory").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserEconomy = typeof userEconomy.$inferSelect;
export type InsertUserEconomy = typeof userEconomy.$inferInsert;
