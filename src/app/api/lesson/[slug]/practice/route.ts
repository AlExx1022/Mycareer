import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { practiceSession } from "@/db/schema";
import { PRACTICE_RUNTIMES } from "@/db/curriculum/types";
import { consumeLlmQuota } from "@/lib/llm-limit";
import { getLessonContextForRequest } from "@/lib/lesson-request-context";
import { generateExercise } from "@/lib/practice-session/llm";
import {
  getEntryCode,
  normalizePracticeWorkspace,
  sanitizeEditableUserFiles,
} from "@/lib/practice-session/workspace";

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
  const requestContext = await getLessonContextForRequest(slug, req.url);
  if (!requestContext || requestContext.lesson.lessonType !== "practice") {
    return new Response("Not Found", { status: 404 });
  }
  const lessonContext = requestContext.lesson;
  if (
    !lessonContext.practiceRuntime ||
    !PRACTICE_RUNTIMES.includes(lessonContext.practiceRuntime) ||
    !lessonContext.practiceBlueprint
  ) {
    return new Response("實作節點缺少支援的 runtime 或 blueprint", {
      status: 422,
    });
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
      const normalized = normalizePracticeWorkspace(existing.exercise, {
        userCode: existing.userCode,
        userFiles: existing.userFiles,
      });
      return Response.json({
        exercise: normalized.workspace,
        userFiles: normalized.userFiles,
        runtime: lessonContext.practiceRuntime,
        status: existing.status,
      });
    }
  }

  if (!(await consumeLlmQuota(userId))) {
    return new Response("今日的 AI 額度已用完，明天再來吧！", { status: 429 });
  }

  const exercise = await generateExercise(lessonContext);
  const { userFiles } = normalizePracticeWorkspace(exercise);

  const row = {
    exercise,
    userCode: getEntryCode(exercise, userFiles),
    userFiles,
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
    userFiles,
    runtime: lessonContext.practiceRuntime,
    status: "in_progress",
  });
}

// 全部可編輯檔案自動儲存（不經 LLM、不計額度）；code 保留給舊 client 相容。
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug } = await params;
  const [requestContext, body] = await Promise.all([
    getLessonContextForRequest(slug, req.url),
    req.json().catch(() => null),
  ]);
  if (!requestContext || requestContext.lesson.lessonType !== "practice") {
    return new Response("Not Found", { status: 404 });
  }
  if (!body || typeof body !== "object") {
    return new Response("Bad Request", { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(practiceSession)
    .where(
      and(
        eq(practiceSession.userId, session.user.id),
        eq(practiceSession.lessonId, slug),
      ),
    );
  if (!existing) return new Response("Not Found", { status: 404 });

  const normalized = normalizePracticeWorkspace(existing.exercise, {
    userCode: existing.userCode,
    userFiles: existing.userFiles,
  });
  const legacyFiles =
    "code" in body && typeof body.code === "string"
      ? { ...normalized.userFiles, [normalized.workspace.entryFile]: body.code }
      : null;
  const userFiles = sanitizeEditableUserFiles(
    normalized.workspace,
    "files" in body ? body.files : legacyFiles,
  );
  if (!userFiles) return new Response("Bad Request", { status: 400 });

  await db
    .update(practiceSession)
    .set({
      userCode: getEntryCode(normalized.workspace, userFiles),
      userFiles,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(practiceSession.userId, session.user.id),
        eq(practiceSession.lessonId, slug),
      ),
    );
  return new Response(null, { status: 204 });
}
