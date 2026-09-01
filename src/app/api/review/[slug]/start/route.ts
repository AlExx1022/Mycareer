import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userLessonMastery } from "@/db/schema";
import { getLessonContext } from "@/db/queries/lesson-context";
import { consumeLlmQuota } from "@/lib/llm-limit";
import { isCracked } from "@/lib/mastery-decay";
import { recentWeaknesses } from "@/db/queries/weakness";
import { stripQuestion } from "@/lib/lesson-session/units";
import {
  generateReviewQuestions,
  loadReview,
  saveReview,
  type ReviewSnapshot,
} from "@/lib/review-session";

export const maxDuration = 300;

// 開始複習：有 session 直接續作（零額度）；沒有則依弱點出題（計 1 次額度）
export async function POST(
  _req: Request,
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

  let snapshot = await loadReview(userId, slug);
  if (!snapshot) {
    const [mastery] = await db
      .select()
      .from(userLessonMastery)
      .where(
        and(
          eq(userLessonMastery.userId, userId),
          eq(userLessonMastery.lessonId, slug),
        ),
      );
    if (!mastery || !isCracked(mastery.score, mastery.assessedAt)) {
      return new Response("這個節點目前不需要複習", { status: 400 });
    }
    if (!(await consumeLlmQuota(userId))) {
      return new Response("今日的 AI 額度已用完，明天再來吧！", {
        status: 429,
      });
    }
    const weaknesses = await recentWeaknesses(userId, slug);
    const questions = await generateReviewQuestions(
      context,
      weaknesses.map((w) => w.summary),
    );
    snapshot = {
      questions,
      results: questions.map(() => ({ correct: false, wrongOnce: false })),
      current: 0,
      sourceWeaknessIds: weaknesses.map((w) => w.id),
    } satisfies ReviewSnapshot;
    await saveReview(userId, slug, snapshot);
  }

  return Response.json({
    question: stripQuestion(snapshot.questions[snapshot.current]),
    progress: {
      question: snapshot.current + 1,
      totalQuestions: snapshot.questions.length,
    },
  });
}
