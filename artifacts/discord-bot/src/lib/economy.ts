import { db, schema } from "../database.js";
import { eq, and } from "drizzle-orm";
import type { UserEconomy } from "../database.js";

export async function getOrCreateEconomy(guildId: string, userId: string): Promise<UserEconomy> {
  const id = `${guildId}:${userId}`;
  const existing = await db.query.userEconomy.findFirst({
    where: eq(schema.userEconomy.id, id),
  });
  if (existing) return existing;
  const [created] = await db.insert(schema.userEconomy).values({ id, guildId, userId }).returning();
  return created;
}

export async function addCoins(guildId: string, userId: string, amount: number): Promise<UserEconomy> {
  const eco = await getOrCreateEconomy(guildId, userId);
  const [updated] = await db.update(schema.userEconomy)
    .set({ coins: Math.max(0, eco.coins + amount), updatedAt: new Date() })
    .where(eq(schema.userEconomy.id, `${guildId}:${userId}`))
    .returning();
  return updated;
}

export async function removeCoins(guildId: string, userId: string, amount: number): Promise<boolean> {
  const eco = await getOrCreateEconomy(guildId, userId);
  if (eco.coins < amount) return false;
  await db.update(schema.userEconomy)
    .set({ coins: eco.coins - amount, updatedAt: new Date() })
    .where(eq(schema.userEconomy.id, `${guildId}:${userId}`));
  return true;
}
