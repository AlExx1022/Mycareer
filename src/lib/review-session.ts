import { and, eq } from "drizzle-orm";
import { generateObject } from "ai";
import type { z } from "zod";
import { db } from "@/db";
import { reviewSession, userLessonMastery } from "@/db/schema";
import { MODEL, type LessonMeta } from "./lesson-session/graph";
import {
  questionRules,
  toUnitQuestion,
  unitQuestionsGenSchema,
  type QuestionResult,
  type UnitQuestion,
} from "./lesson-session/units";

// state schema 版本；不相容時視同無 session、重新出題
export const REVIEW_STATE_VERSION = 1;

export type ReviewSnapshot = {
  questions: UnitQuestion[];
  results: QuestionResult[];
  current: number;
  sourceWeaknessIds: number[];
};

export async function loadReview(
  userId: string,
  lessonId: string,
): Promise<ReviewSnapshot | null> {
  const [row] = await db
    .select()
    .from(reviewSession)
    .where(
      and(
        eq(reviewSession.userId, userId),
        eq(reviewSession.lessonId, lessonId),
      ),
    );
  if (!row || row.version !== REVIEW_STATE_VERSION) return null;
  return {
    questions: row.questions,
    results: row.results,
    current: row.current,
    sourceWeaknessIds: row.sourceWeaknessIds,
  };
}

export async function saveReview(
  userId: string,
  lessonId: string,
  snapshot: ReviewSnapshot,
) {
  const row = {
    version: REVIEW_STATE_VERSION,
    ...snapshot,
    updatedAt: new Date(),
  };
  await db
    .insert(reviewSession)
    .values({ userId, lessonId, ...row })
    .onConflictDoUpdate({
      target: [reviewSession.userId, reviewSession.lessonId],
      set: row,
    });
}

// 首次答對率決定新分數（70–100）：答得差 → 衰減快 → 更早再進佇列（design D6）
export function reviewScore(results: QuestionResult[]): number {
  const firstTry = results.filter((r) => r.correct && !r.wrongOnce).length;
  return 70 + Math.round((30 * firstTry) / results.length);
}

// 完成複習：依 server 端作答記錄回寫掌握度、刪 session（下次裂開重新出題）
export async function completeReview(
  userId: string,
  lessonId: string,
  results: QuestionResult[],
): Promise<number> {
  const score = reviewScore(results);
  await db
    .insert(userLessonMastery)
    .values({ userId, lessonId, score, assessedAt: new Date() })
    .onConflictDoUpdate({
      target: [userLessonMastery.userId, userLessonMastery.lessonId],
      set: { score, assessedAt: new Date() },
    });
  await db
    .delete(reviewSession)
    .where(
      and(
        eq(reviewSession.userId, userId),
        eq(reviewSession.lessonId, lessonId),
      ),
    );
  return score;
}

// ---- 出題（打向弱點；無弱點退回考點）----

export async function generateReviewQuestions(
  lesson: LessonMeta,
  weaknesses: string[],
): Promise<UnitQuestion[]> {
  // ponytail: 生成不合格就整批重打一次，再失敗讓錯誤浮上去（同單元出題）
  let questions = convert(await generate(lesson, weaknesses));
  if (questions.length < 3) {
    questions = convert(await generate(lesson, weaknesses));
  }
  if (questions.length < 3) {
    throw new Error(`複習出題失敗：有效題目不足（${questions.length}）`);
  }
  return questions;
}

function convert(
  object: z.infer<typeof unitQuestionsGenSchema>,
): UnitQuestion[] {
  return object.questions
    .map((q, i) => toUnitQuestion(q, `rq${i}`))
    .filter((q): q is UnitQuestion => q !== null);
}

async function generate(lesson: LessonMeta, weaknesses: string[]) {
  const focus = weaknesses.length
    ? `學生之前在這個節點犯過這些錯：

${weaknesses.map((w) => `- ${w}`).join("\n")}

題目刻意打向這些誤解，驗證他是否已經修正。`
    : `這個節點的考點：

${lesson.examPoints.map((p) => `- ${p}`).join("\n")}

以考點為範圍出題，重點放在最容易忘的原理與常見誤解。`;

  const { object } = await generateObject({
    model: MODEL,
    schema: unitQuestionsGenSchema,
    maxRetries: 1,
    prompt: `為 ${lesson.subject} 學習路徑「${lesson.pathTitle}」的節點「${lesson.title}」出複習題，這個節點的記憶已經衰退，要幫學生撿回來。程式碼與語法必須使用 ${lesson.codeLanguage}。

${focus}

${questionRules(lesson.codeLanguage)}`,
  });
  return object;
}
