import { generateObject } from "ai";
import { z } from "zod";
import { MODEL, type LessonMeta } from "./graph";

// ---- LLM 生成用平面 schema ----
// ponytail: Gemini 結構化輸出對 discriminated union / 巢狀物件不可靠，
// 全欄位必填的平面 schema + code 端轉換，不相關欄位要求給空值
const genItemSchema = z.object({
  type: z.enum(["choice", "fill", "match", "free"]),
  prompt: z
    .string()
    .describe("題幹，繁體中文一兩句；fill 的挖空用 ___ 表示"),
  options: z
    .array(z.string())
    .describe("choice 專用：3-4 個選項，僅一個正確；其他題型給空陣列"),
  answer: z
    .number()
    .int()
    .describe("choice 專用：正確選項 index；其他題型給 0"),
  answers: z
    .array(z.string())
    .describe("fill 專用：可接受答案含同義寫法 1-4 組；其他題型給空陣列"),
  lefts: z
    .array(z.string())
    .describe("match 專用：左側 3-4 項；其他題型給空陣列"),
  rights: z
    .array(z.string())
    .describe("match 專用：與 lefts 同長度、依序一一對應的右側；其他題型給空陣列"),
  expectedPoints: z
    .array(z.string())
    .describe("free 專用：回答須涵蓋的核心概念 1-3 個；其他題型給空陣列"),
  explanation: z.string().describe("一兩句解析，答錯時顯示"),
  wrongSummary: z
    .string()
    .describe("一句話描述答錯這題代表的觀念誤解，用於弱點記錄"),
});

export const unitQuestionsGenSchema = z.object({
  questions: z.array(genItemSchema).min(3).max(5),
});

type GenItem = z.infer<typeof genItemSchema>;

// ---- 落 snapshot 的題目 ----

type QuestionBase = {
  id: string;
  prompt: string;
  explanation: string;
  wrongSummary: string;
};

export type UnitQuestion =
  | (QuestionBase & { type: "choice"; options: string[]; answer: number })
  | (QuestionBase & { type: "fill"; answers: string[] })
  | (QuestionBase & {
      type: "match";
      pairs: { left: string; right: string }[];
      // 右側顯示順序，值為 pairs 的 index
      rightOrder: number[];
    })
  | (QuestionBase & { type: "free"; expectedPoints: string[] });

export type QuestionResult = { correct: boolean; wrongOnce: boolean };

export type UnitState = {
  examPoint: string;
  questions: UnitQuestion[];
  results: QuestionResult[];
  current: number;
};

export type UnitsState = {
  units: UnitState[];
  currentUnit: number;
};

export function freshUnitsState(lesson: LessonMeta): UnitsState {
  return {
    units: lesson.examPoints.map((examPoint) => ({
      examPoint,
      questions: [],
      results: [],
      current: 0,
    })),
    currentUnit: 0,
  };
}

// 平面生成項 → 題目；不滿足該題型必要條件回 null（丟棄）
export function toUnitQuestion(item: GenItem, id: string): UnitQuestion | null {
  const base = {
    id,
    prompt: item.prompt,
    explanation: item.explanation,
    wrongSummary: item.wrongSummary,
  };
  switch (item.type) {
    case "choice":
      if (item.options.length < 2) return null;
      if (item.answer < 0 || item.answer >= item.options.length) return null;
      return { ...base, type: "choice", options: item.options, answer: item.answer };
    case "fill":
      if (item.answers.length === 0) return null;
      return { ...base, type: "fill", answers: item.answers };
    case "match": {
      if (item.lefts.length < 2 || item.lefts.length !== item.rights.length)
        return null;
      const pairs = item.lefts.map((left, i) => ({
        left,
        right: item.rights[i],
      }));
      return {
        ...base,
        type: "match",
        pairs,
        rightOrder: shuffle(pairs.map((_, j) => j)),
      };
    }
    case "free":
      if (item.expectedPoints.length === 0) return null;
      return { ...base, type: "free", expectedPoints: item.expectedPoints };
  }
}

// ---- 出題（一單元一次呼叫）----

export async function generateUnitQuestions(
  lesson: LessonMeta,
  examPoint: string,
  unitIndex: number,
): Promise<UnitQuestion[]> {
  // ponytail: 生成不合格就整批重打一次，再失敗讓錯誤浮上去
  let questions = convert(await generate(lesson, examPoint), unitIndex);
  if (questions.length < 3) {
    questions = convert(await generate(lesson, examPoint), unitIndex);
  }
  if (questions.length < 3) {
    throw new Error(`單元出題失敗：有效題目不足（${questions.length}）`);
  }
  return questions;
}

function convert(
  object: z.infer<typeof unitQuestionsGenSchema>,
  unitIndex: number,
): UnitQuestion[] {
  return object.questions
    .map((q, i) => toUnitQuestion(q, `u${unitIndex}q${i}`))
    .filter((q): q is UnitQuestion => q !== null);
}

// 出題機械規則（單元出題與複習出題共用）
export const QUESTION_RULES = `規則：
- 出 3-5 題，題型混用選擇（choice）、填空（fill）、配對（match）、問答（free），至少三種題型，問答最多一題、放最後。
- 由易到難，每題只考一個小概念，題幹一兩句話就好，不要長篇情境。
- 內容適合讀程式碼的話，至少一題是讀碼/補碼題：題幹放一小段 TypeScript（反引號標記），用 choice 問輸出／行為，或用 fill 補上挖空的關鍵字。
- 每題只填該題型需要的欄位，其他欄位一律給空陣列（answer 給 0）。
- match 的 lefts 與 rights 依序一一對應（顯示時系統會打亂）。
- explanation 一兩句講清楚為什麼；wrongSummary 一句話描述答錯代表的誤解。
- 全部繁體中文，語氣輕鬆。`;

async function generate(lesson: LessonMeta, examPoint: string) {
  const { object } = await generateObject({
    model: MODEL,
    schema: unitQuestionsGenSchema,
    maxRetries: 1,
    prompt: `為 React 技能樹節點「${lesson.title}」的小單元出題。本單元只考這個考點：

${examPoint}

${QUESTION_RULES}`,
  });
  return object;
}

function shuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- 判定（客觀題 server 端比對，不經 LLM）----

function normalizeFill(s: string): string {
  return s.trim().toLowerCase();
}

export function judgeAnswer(q: UnitQuestion, answer: unknown): boolean {
  switch (q.type) {
    case "choice":
      return answer === q.answer;
    case "fill":
      return (
        typeof answer === "string" &&
        q.answers.some((a) => normalizeFill(a) === normalizeFill(answer))
      );
    case "match":
      // answer[i] = 左側第 i 項配到的右側「顯示位置」
      return (
        Array.isArray(answer) &&
        answer.length === q.pairs.length &&
        answer.every((p, i) => Number.isInteger(p) && q.rightOrder[p] === i)
      );
    case "free":
      throw new Error("free 題走 judgeFreeAnswer");
  }
}

// 問答題：LLM 對照判定要點，計一次額度（呼叫端負責扣）
export async function judgeFreeAnswer(
  q: Extract<UnitQuestion, { type: "free" }>,
  answer: string,
): Promise<{ correct: boolean; feedback: string }> {
  const { object } = await generateObject({
    model: MODEL,
    schema: z.object({
      correct: z.boolean().describe("回答是否涵蓋全部判定要點的核心意思"),
      feedback: z
        .string()
        .describe(
          "一句話回饋，繁體中文，答對肯定、答錯點出缺什麼但不直接給答案",
        ),
    }),
    maxRetries: 1,
    prompt: `判定學生對問答題的回答是否正確。用語不必一致，意思到位就算對。

題目：${q.prompt}

回答必須涵蓋的要點：
${q.expectedPoints.map((p) => `- ${p}`).join("\n")}

學生的回答：
${answer}`,
  });
  return object;
}

// ---- client payload（剝除正解與解析）----

export type ClientQuestion =
  | { id: string; type: "choice"; prompt: string; options: string[] }
  | { id: string; type: "fill"; prompt: string }
  | { id: string; type: "match"; prompt: string; lefts: string[]; rights: string[] }
  | { id: string; type: "free"; prompt: string };

export type QuestionProgress = {
  unit: number;
  totalUnits: number;
  question: number;
  totalQuestions: number;
};

export type QuestionData = {
  question: ClientQuestion;
  progress: QuestionProgress;
};

export function stripQuestion(q: UnitQuestion): ClientQuestion {
  switch (q.type) {
    case "choice":
      return { id: q.id, type: "choice", prompt: q.prompt, options: q.options };
    case "fill":
      return { id: q.id, type: "fill", prompt: q.prompt };
    case "match":
      return {
        id: q.id,
        type: "match",
        prompt: q.prompt,
        lefts: q.pairs.map((p) => p.left),
        rights: q.rightOrder.map((j) => q.pairs[j].right),
      };
    case "free":
      return { id: q.id, type: "free", prompt: q.prompt };
  }
}
