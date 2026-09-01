import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { weaknessRecord } from "@/db/schema";
import { getLessonContext } from "@/db/queries/lesson-context";
import { consumeLlmQuota } from "@/lib/llm-limit";
import {
  judgeAnswer,
  judgeFreeAnswer,
  stripQuestion,
} from "@/lib/lesson-session/units";
import {
  completeReview,
  loadReview,
  saveReview,
} from "@/lib/review-session";

export const maxDuration = 300;

// 複習作答：判定機制同課程單元題；完成時依 server 端作答記錄回寫掌握度
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const { slug } = await params;
  const context = await getLessonContext(slug);
  if (!context || context.lessonType !== "concept") {
    return new Response("Not Found", { status: 404 });
  }

  const snapshot = await loadReview(userId, slug);
  if (!snapshot) return new Response("Bad Request", { status: 400 });

  const { questionId, answer } = await req.json();
  const q = snapshot.questions[snapshot.current];
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
    const judged = await judgeFreeAnswer(q, answer, context);
    correct = judged.correct;
    explanation = judged.feedback;
  } else {
    correct = judgeAnswer(q, answer);
    explanation = correct ? "" : q.explanation;
  }

  const result = snapshot.results[snapshot.current];
  if (!correct && !result.wrongOnce) {
    result.wrongOnce = true;
    // ponytail: 複習題橫跨多個弱點、無單一考點，criterion 固定為「複習」
    await db.insert(weaknessRecord).values({
      userId,
      lessonId: slug,
      criterion: "複習",
      summary: q.wrongSummary,
      createdAt: new Date(),
    });
  }

  let next = null;
  let done = false;
  let score: number | null = null;
  if (correct) {
    result.correct = true;
    snapshot.current += 1;
    if (snapshot.current < snapshot.questions.length) {
      next = stripQuestion(snapshot.questions[snapshot.current]);
    } else {
      done = true;
      score = await completeReview(userId, slug, snapshot.results);
    }
  }
  if (!done) await saveReview(userId, slug, snapshot);

  return Response.json({
    correct,
    explanation,
    next,
    done,
    score,
    progress: {
      question: Math.min(snapshot.current + 1, snapshot.questions.length),
      totalQuestions: snapshot.questions.length,
    },
  });
}
