import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { weaknessRecord } from "@/db/schema";

export type WeaknessSummary = { id: number; summary: string; createdAt: Date };

/** 該節點最近的弱點（新→舊），出題與佇列共用。 */
export async function recentWeaknesses(
  userId: string,
  lessonId: string,
  limit = 10,
): Promise<WeaknessSummary[]> {
  return db
    .select({
      id: weaknessRecord.id,
      summary: weaknessRecord.summary,
      createdAt: weaknessRecord.createdAt,
    })
    .from(weaknessRecord)
    .where(
      and(
        eq(weaknessRecord.userId, userId),
        eq(weaknessRecord.lessonId, lessonId),
      ),
    )
    .orderBy(desc(weaknessRecord.createdAt))
    .limit(limit);
}

/** 使用者全部弱點依節點分組（每組新→舊），供佇列顯示。 */
export async function weaknessesByLesson(
  userId: string,
): Promise<Map<string, WeaknessSummary[]>> {
  const rows = await db
    .select({
      lessonId: weaknessRecord.lessonId,
      id: weaknessRecord.id,
      summary: weaknessRecord.summary,
      createdAt: weaknessRecord.createdAt,
    })
    .from(weaknessRecord)
    .where(eq(weaknessRecord.userId, userId))
    .orderBy(desc(weaknessRecord.createdAt));

  const byLesson = new Map<string, WeaknessSummary[]>();
  for (const { lessonId, ...w } of rows) {
    const list = byLesson.get(lessonId) ?? [];
    list.push(w);
    byLesson.set(lessonId, list);
  }
  return byLesson;
}
