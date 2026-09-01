import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  practiceSession,
  userLessonMastery,
  weaknessRecord,
} from "@/db/schema";
import { consumeLlmQuota } from "@/lib/llm-limit";
import { getLessonContextForRequest } from "@/lib/lesson-request-context";
import { reviewCode } from "@/lib/practice-session/llm";
import {
  getEntryCode,
  normalizePracticeWorkspace,
  sanitizeEditableUserFiles,
} from "@/lib/practice-session/workspace";
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
  const requestContext = await getLessonContextForRequest(slug, req.url);
  if (!requestContext || requestContext.lesson.lessonType !== "practice") {
    return new Response("Not Found", { status: 404 });
  }
  const { lesson: lessonContext, previewPathId } = requestContext;
  if (!lessonContext.practiceRuntime || !lessonContext.practiceBlueprint) {
    return new Response("實作節點缺少 runtime 或 blueprint", { status: 422 });
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

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return new Response("Bad Request", { status: 400 });
  }
  const normalized = normalizePracticeWorkspace(practice.exercise, {
    userCode: practice.userCode,
    userFiles: practice.userFiles,
  });
  const legacyFiles =
    "code" in body && typeof body.code === "string"
      ? { ...normalized.userFiles, [normalized.workspace.entryFile]: body.code }
      : null;
  const userFiles = sanitizeEditableUserFiles(
    normalized.workspace,
    "files" in body ? body.files : legacyFiles,
  );
  if (
    !userFiles ||
    !getEntryCode(normalized.workspace, userFiles).trim()
  ) {
    return new Response("Bad Request", { status: 400 });
  }

  if (!(await consumeLlmQuota(userId))) {
    return new Response("今日的 AI 額度已用完，明天再來吧！", { status: 429 });
  }

  // 過關判定在 server 端：client 的測試結果只是送審門票（design D4）
  const review = await reviewCode(
    lessonContext,
    normalized.workspace,
    userFiles,
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
      userCode: getEntryCode(normalized.workspace, userFiles),
      userFiles,
      status: passed ? "passed" : "in_progress",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(practiceSession.userId, userId),
        eq(practiceSession.lessonId, slug),
      ),
    );

  let navigation = null;
  if (passed) {
    await db
      .insert(userLessonMastery)
      .values({ userId, lessonId: slug, score: 100, assessedAt: new Date() })
      .onConflictDoUpdate({
        target: [userLessonMastery.userId, userLessonMastery.lessonId],
        set: { score: 100, assessedAt: new Date() },
      });
    navigation = await nextAvailableLesson(userId, slug, {
      includeDraft: previewPathId !== null,
    });
  }

  return Response.json({
    verdict: review.verdict,
    comments: review.comments,
    next: navigation?.next ?? null,
    pathComplete: navigation?.pathComplete ?? false,
    pathId: navigation?.pathId ?? lessonContext.pathId,
  });
}
