import { sql } from "drizzle-orm";
import { db } from "@/db";
import { llmUsage } from "@/db/schema";

export const DAILY_LIMIT = Number(process.env.LLM_DAILY_LIMIT ?? 50);

export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 原子遞增當日計數並回傳是否仍在額度內。超額時計數不再具意義但照加，無害。 */
export async function consumeLlmQuota(
  userId: string,
  limit = DAILY_LIMIT,
): Promise<boolean> {
  const [row] = await db
    .insert(llmUsage)
    .values({ userId, day: utcDay(new Date()), count: 1 })
    .onConflictDoUpdate({
      target: [llmUsage.userId, llmUsage.day],
      set: { count: sql`${llmUsage.count} + 1` },
    })
    .returning({ count: llmUsage.count });
  return row.count <= limit;
}
