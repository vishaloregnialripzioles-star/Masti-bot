import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const guildSettings = pgTable("guild_settings", {
  guildId: text("guild_id").primaryKey(),
  modmailChannelId: text("modmail_channel_id"),
  staffRoleId: text("staff_role_id"),
  logChannelId: text("log_channel_id"),
  muteRoleId: text("mute_role_id"),
  chatbanRoleId: text("chatban_role_id"),
  spamFilterEnabled: boolean("spam_filter_enabled").default(true),
  emojiFilterEnabled: boolean("emoji_filter_enabled").default(true),
  capsFilterEnabled: boolean("caps_filter_enabled").default(true),
  inviteFilterEnabled: boolean("invite_filter_enabled").default(true),
  leaderboardEnabled: boolean("leaderboard_enabled").default(false),
  leaderboardChannelId: text("leaderboard_channel_id"),
  leaderboardMessageId: text("leaderboard_message_id"),
  xpEnabled: boolean("xp_enabled").default(true),
  economyEnabled: boolean("economy_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GuildSettings = typeof guildSettings.$inferSelect;
export type InsertGuildSettings = typeof guildSettings.$inferInsert;
