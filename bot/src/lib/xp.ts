import { db, schema } from "../database.js";
import { eq } from "drizzle-orm";
import { xpForLevel, levelForXp } from "../config.js";
import type { UserXp } from "../database.js";

export async function getOrCreateXp(guildId: string, userId: string): Promise<UserXp> {
  const id = `${guildId}:${userId}`;
  const existing = await db.query.userXp.findFirst({ where: eq(schema.userXp.id, id) });
  if (existing) return existing;
  const [created] = await db.insert(schema.userXp).values({ id, guildId, userId }).returning();
  return created;
}

export interface XpResult {
  xp: UserXp;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
}

export async function addXp(guildId: string, userId: string, amount: number): Promise<XpResult> {
  const xpData = await getOrCreateXp(guildId, userId);
  const oldLevel = xpData.level;
  const newTotalXp = (xpData.totalXp ?? 0) + amount;
  const newLevel = levelForXp(newTotalXp);
  const newXp = xpData.xp + amount;

  const [updated] = await db.update(schema.userXp)
    .set({ xp: newXp, level: newLevel, totalXp: newTotalXp, updatedAt: new Date(), lastMessageAt: new Date() })
    .where(eq(schema.userXp.id, `${guildId}:${userId}`))
    .returning();

  return { xp: updated, leveledUp: newLevel > oldLevel, oldLevel, newLevel };
}
