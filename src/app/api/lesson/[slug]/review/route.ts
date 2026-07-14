import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  lesson,
  practiceSession,
  userLessonMastery,
  weaknessRecord,
} from "@/db/schema";
import { consumeLlmQuota } from "@/lib/llm-limit";
import { reviewCode } from "@/lib/practice-session/llm";
import { nextAvailableLesson } from "@/lib/next-lesson";

export const maxDuration = 300;

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

  const [practice] = await db
    .select()
    .from(practiceSession)
    .where(
      and(
        eq(practiceSession.userId, userId),
        eq(practiceSession.lessonId, slug),
      ),
    );
  if (!practice) return new Response("Not Found", { status: 404 });

  const { code } = await req.json();
  if (typeof code !== "string" || !code.trim() || code.length > 20_000) {
    return new Response("Bad Request", { status: 400 });
  }

  if (!(await consumeLlmQuota(userId))) {
    return new Response("今日的 AI 額度已用完，明天再來吧！", { status: 429 });
  }

  // 過關判定在 server 端：client 的測試結果只是送審門票（design D4）
  const review = await reviewCode(
    { id: found.id, title: found.title, examPoints: found.examPoints, rubric: found.rubric },
    practice.exercise,
    code,
  );

  if (review.weaknesses.length > 0) {
    await db.insert(weaknessRecord).values(
      review.weaknesses.map((w) => ({
        userId,
        lessonId: slug,
        criterion: w.criterion,
        summary: w.summary,
        createdAt: new Date(),
      })),
    );
  }

  const passed = review.verdict === "pass";
  await db
    .update(practiceSession)
    .set({
      userCode: code,
      status: passed ? "passed" : "in_progress",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(practiceSession.userId, userId),
        eq(practiceSession.lessonId, slug),
      ),
    );

  let next = null;
  if (passed) {
    await db
      .insert(userLessonMastery)
      .values({ userId, lessonId: slug, score: 100, assessedAt: new Date() })
      .onConflictDoUpdate({
        target: [userLessonMastery.userId, userLessonMastery.lessonId],
        set: { score: 100, assessedAt: new Date() },
      });
    next = await nextAvailableLesson(userId, slug);
  }

  return Response.json({
    verdict: review.verdict,
    comments: review.comments,
    next,
  });
}
