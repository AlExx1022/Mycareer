import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { lesson, weaknessRecord } from "@/db/schema";
import { consumeLlmQuota } from "@/lib/llm-limit";
import {
  judgeAnswer,
  judgeFreeAnswer,
  stripQuestion,
} from "@/lib/lesson-session/units";
import { loadSession, saveSession } from "@/lib/lesson-session/store";

export const maxDuration = 300;

// 單元題作答：客觀題 server 比對正解（零 LLM）、問答題 LLM 判定（計額度）
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

  const snapshot = await loadSession(userId, slug);
  const us = snapshot.unitsState;
  if (snapshot.phase !== "units" || !us) {
    return new Response("Bad Request", { status: 400 });
  }

  const { questionId, answer } = await req.json();
  const unit = us.units[us.currentUnit];
  const q = unit.questions[unit.current];
  // 只接受當前題作答（一次一題）
  if (!q || q.id !== questionId) {
    return new Response("Bad Request", { status: 400 });
  }

  let correct: boolean;
  let explanation: string;
  if (q.type === "free") {
    if (typeof answer !== "string" || !answer.trim() || answer.length > 2000) {
      return new Response("Bad Request", { status: 400 });
    }
    if (!(await consumeLlmQuota(userId))) {
      return new Response("今日的 AI 額度已用完，明天再來吧！", {
        status: 429,
      });
    }
    const judged = await judgeFreeAnswer(q, answer);
    correct = judged.correct;
    explanation = judged.feedback;
  } else {
    correct = judgeAnswer(q, answer);
    explanation = correct ? "" : q.explanation;
  }

  const result = unit.results[unit.current];
  if (!correct && !result.wrongOnce) {
    result.wrongOnce = true;
    await db.insert(weaknessRecord).values({
      userId,
      lessonId: slug,
      criterion: unit.examPoint,
      summary: q.wrongSummary,
      createdAt: new Date(),
    });
  }

  let next = null;
  let unitComplete = false;
  let allUnitsComplete = false;
  if (correct) {
    result.correct = true;
    unit.current += 1;
    if (unit.current < unit.questions.length) {
      next = stripQuestion(unit.questions[unit.current]);
    } else {
      unitComplete = true;
      us.currentUnit += 1;
      if (us.currentUnit >= us.units.length) {
        allUnitsComplete = true;
        snapshot.phase = "teach"; // 收尾檢核由 sessionGraph 接手
      }
    }
  }
  await saveSession(userId, slug, snapshot);

  return Response.json({
    correct,
    explanation,
    next,
    unitComplete,
    allUnitsComplete,
    progress: {
      unit: Math.min(us.currentUnit + 1, us.units.length),
      totalUnits: us.units.length,
      question: Math.min(unit.current + 1, unit.questions.length),
      totalQuestions: unit.questions.length,
    },
  });
}
