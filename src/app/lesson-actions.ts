"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userLessonMastery } from "@/db/schema";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session.user.id;
}

export async function markLessonKnown(lessonId: string) {
  const userId = await requireUserId();
  await db
    .insert(userLessonMastery)
    .values({ userId, lessonId, score: 100, assessedAt: new Date() })
    .onConflictDoUpdate({
      target: [userLessonMastery.userId, userLessonMastery.lessonId],
      set: { score: 100, assessedAt: new Date() },
    });
  revalidatePath("/tree", "layout");
}

export async function unmarkLessonKnown(lessonId: string) {
  const userId = await requireUserId();
  await db
    .delete(userLessonMastery)
    .where(
      and(
        eq(userLessonMastery.userId, userId),
        eq(userLessonMastery.lessonId, lessonId),
      ),
    );
  revalidatePath("/tree", "layout");
}
