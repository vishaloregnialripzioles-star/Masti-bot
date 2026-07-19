import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  roleId: text("role_id"),
  itemType: text("item_type").notNull().default("vanity"), // vanity, pet_food, pet_toy, badge
  emoji: text("emoji"),
  stock: integer("stock").default(-1).notNull(), // -1 = unlimited
  available: boolean("available").default(true).notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = typeof shopItems.$inferInsert;
