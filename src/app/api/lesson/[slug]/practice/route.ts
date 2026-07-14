import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { lesson, practiceSession } from "@/db/schema";
import { consumeLlmQuota } from "@/lib/llm-limit";
import { generateExercise } from "@/lib/practice-session/llm";

export const maxDuration = 300;

// get-or-generate 題目；regenerate: true 時刪掉重出
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const { slug } = await params;
  const [found] = await db.select().from(lesson).where(eq(lesson.id, slug));
  if (!found || found.type !== "practice") {
    return new Response("Not Found", { status: 404 });
  }

  const { regenerate } = await req
    .json()
    .catch(() => ({ regenerate: false }));

  if (!regenerate) {
    const [existing] = await db
      .select()
      .from(practiceSession)
      .where(
        and(
          eq(practiceSession.userId, userId),
          eq(practiceSession.lessonId, slug),
        ),
      );
    if (existing) {
      return Response.json({
        exercise: existing.exercise,
        userCode: existing.userCode,
        status: existing.status,
      });
    }
  }

  if (!(await consumeLlmQuota(userId))) {
    return new Response("今日的 AI 額度已用完，明天再來吧！", { status: 429 });
  }

  const exercise = await generateExercise({
    id: found.id,
    title: found.title,
    examPoints: found.examPoints,
    rubric: found.rubric,
  });

  const row = {
    exercise,
    userCode: exercise.starterCode,
    status: "in_progress" as const,
    updatedAt: new Date(),
  };
  await db
    .insert(practiceSession)
    .values({ userId, lessonId: slug, ...row })
    .onConflictDoUpdate({
      target: [practiceSession.userId, practiceSession.lessonId],
      set: row,
    });

  return Response.json({
    exercise,
    userCode: exercise.starterCode,
    status: "in_progress",
  });
}

// userCode 自動儲存（不經 LLM、不計額度）
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug } = await params;
  const { code } = await req.json();
  if (typeof code !== "string" || code.length > 20_000) {
    return new Response("Bad Request", { status: 400 });
  }

  await db
    .update(practiceSession)
    .set({ userCode: code, updatedAt: new Date() })
    .where(
      and(
        eq(practiceSession.userId, session.user.id),
        eq(practiceSession.lessonId, slug),
      ),
    );
  return new Response(null, { status: 204 });
}
