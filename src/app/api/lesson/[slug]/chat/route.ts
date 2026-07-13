import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { lesson, userLessonMastery, weaknessRecord } from "@/db/schema";
import { consumeLlmQuota } from "@/lib/llm-limit";
import { getSkillTreeForUser } from "@/db/queries/skill-tree";
import { deriveNodeStates } from "@/lib/skill-tree";
import {
  sessionGraph,
  systemPrompt,
  MODEL,
  type LessonMeta,
} from "@/lib/lesson-session/graph";
import { loadSession, saveSession } from "@/lib/lesson-session/store";

export const maxDuration = 300;

// 假設當前節點已過關，找出路線上下一個可學節點
async function nextLessonHint(userId: string, currentId: string) {
  const units = await getSkillTreeForUser(userId);
  const lessons = units
    .flatMap((u) => u.lessons)
    .map((l) =>
      l.id === currentId
        ? { ...l, mastery: { score: 100, assessedAt: new Date() } }
        : l,
    );
  const states = deriveNodeStates(lessons);
  const next = lessons.find(
    (l) => l.id !== currentId && states.get(l.id) === "available",
  );
  return next
    ? `推薦他下一站學「${next.title}」，並附上連結（markdown 格式）：[${next.title}](/lesson/${next.id})。`
    : "告訴他目前路線上已沒有其他可學節點，可以回技能樹看看全貌。";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const { slug } = await params;
  const [found] = await db.select().from(lesson).where(eq(lesson.id, slug));
  if (!found || found.type !== "concept") {
    return new Response("Not Found", { status: 404 });
  }

  if (!(await consumeLlmQuota(userId))) {
    return new Response("今日的 AI 對話額度已用完，明天再來吧！", {
      status: 429,
    });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
  const lastUser = messages.findLast((m) => m.role === "user");
  const userText =
    lastUser?.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("") ?? "";

  const meta: LessonMeta = {
    id: found.id,
    title: found.title,
    examPoints: found.examPoints,
    rubric: found.rubric,
  };

  const snapshot = await loadSession(userId, slug);
  snapshot.messages.push({ role: "user", content: userText });

  let instructions: string;
  if (snapshot.phase === "passed") {
    instructions = "學生已通過本節點檢核，這是過關後的自由問答，直接回答問題。";
  } else {
    const hint =
      snapshot.phase === "teach" ? "" : await nextLessonHint(userId, slug);
    const result = await sessionGraph.invoke({
      lesson: meta,
      messages: snapshot.messages,
      phase: snapshot.phase,
      checkState: snapshot.checkState,
      nextLessonHint: hint,
      replyInstructions: "",
      newWeaknesses: [],
    });

    snapshot.phase = result.phase;
    snapshot.checkState = result.checkState;
    instructions = result.replyInstructions;

    if (result.newWeaknesses.length > 0) {
      await db.insert(weaknessRecord).values(
        result.newWeaknesses.map((w) => ({
          userId,
          lessonId: slug,
          criterion: w.criterion,
          summary: w.summary,
          createdAt: new Date(),
        })),
      );
    }
    if (result.phase === "passed") {
      await db
        .insert(userLessonMastery)
        .values({ userId, lessonId: slug, score: 100, assessedAt: new Date() })
        .onConflictDoUpdate({
          target: [userLessonMastery.userId, userLessonMastery.lessonId],
          set: { score: 100, assessedAt: new Date() },
        });
    }
  }

  const result = streamText({
    model: MODEL,
    system: systemPrompt(meta, instructions),
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      snapshot.messages.push({ role: "assistant", content: text });
      await saveSession(userId, slug, snapshot);
    },
  });

  return result.toUIMessageStreamResponse();
}
