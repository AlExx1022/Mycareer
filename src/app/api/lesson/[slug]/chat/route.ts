import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
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
import {
  freshUnitsState,
  generateUnitQuestions,
  stripQuestion,
  type QuestionData,
} from "@/lib/lesson-session/units";
import { loadSession, saveSession } from "@/lib/lesson-session/store";

export const maxDuration = 300;

// 假設當前節點已過關，找出路線上下一個可學節點
async function nextLessonHint(userId: string, currentId: string) {
  const units = await getSkillTreeForUser(userId);
  const lessons = units
    .flatMap((u) => u.lessons)
    .map((l) =>
      l.id === currentId
        ? {
            ...l,
            mastery: {
              score: 100,
              assessedAt: new Date(),
              effective: 100,
              cracked: false,
            },
          }
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
  let questionData: QuestionData | null = null;

  if (snapshot.phase === "units") {
    if (!snapshot.unitsState) snapshot.unitsState = freshUnitsState(meta);
    const us = snapshot.unitsState;
    const unit = us.units[us.currentUnit];

    if (unit.questions.length === 0) {
      unit.questions = await generateUnitQuestions(
        meta,
        unit.examPoint,
        us.currentUnit,
      );
      unit.results = unit.questions.map(() => ({
        correct: false,
        wrongOnce: false,
      }));
      unit.current = 0;
      // 題目先落 DB，streaming 中斷也不用重新出題
      await saveSession(userId, slug, snapshot);
      instructions = `現在開始第 ${us.currentUnit + 1}/${us.units.length} 個小單元，考點：「${unit.examPoint}」。依序講：是什麼（一句話定義）→ 為什麼（背後的原因或動機）→ 一個貼近開發情境的類比 → 程式碼例（TypeScript，8 行以內）。全文 200–400 字，分段呈現、不要編號標題。${
        us.currentUnit === 0
          ? "這是本節第一個單元，從直覺切入，程式碼例可省略。"
          : "學生已完成前面單元，可直接往原理與常見誤解走，不要重複基礎。"
      }結尾一句話預告接下來有 ${unit.questions.length} 題小練習。不要自己出題或提問，練習題由系統呈現。`;
    } else {
      instructions = `學生正在第 ${us.currentUnit + 1}/${us.units.length} 個小單元的練習中途傳訊息。簡短回應（100 字以內），鼓勵他繼續作答目前的題目。不要透露任何題目的答案。`;
    }

    questionData = {
      question: stripQuestion(unit.questions[unit.current]),
      progress: {
        unit: us.currentUnit + 1,
        totalUnits: us.units.length,
        question: unit.current + 1,
        totalQuestions: unit.questions.length,
      },
    };
  } else if (snapshot.phase === "passed") {
    instructions =
      "學生已通過本節點檢核，這是過關後的自由問答，直接回答問題。";
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

  const modelMessages = await convertToModelMessages(messages, {
    ignoreIncompleteToolCalls: true,
  });

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const result = streamText({
        model: MODEL,
        system: systemPrompt(meta, instructions),
        messages: modelMessages,
        onFinish: async ({ text }) => {
          snapshot.messages.push({ role: "assistant", content: text });
          await saveSession(userId, slug, snapshot);
        },
      });
      writer.merge(result.toUIMessageStream());
      if (questionData) {
        writer.write({ type: "data-question", data: questionData });
      }
    },
  });
  return createUIMessageStreamResponse({ stream });
}
