import { generateObject } from "ai";
import { z } from "zod";
import type { PracticeExercise, RubricItem } from "@/db/schema";
import { MODEL } from "@/lib/lesson-session/graph";

export type PracticeLessonMeta = {
  id: string;
  title: string;
  examPoints: string[];
  rubric: RubricItem[];
};

export const exerciseSchema = z.object({
  description: z
    .string()
    .describe("題目說明，繁體中文，含情境、要求、輸入輸出範例"),
  starterCode: z
    .string()
    .describe("TypeScript 起始碼，含函式簽名與 TODO 註解，學生從這裡開始寫"),
  testCode: z
    .string()
    .describe("測試碼，Jest 風格全域 describe/it/expect，不 import 測試框架"),
});

export const reviewSchema = z.object({
  verdict: z
    .enum(["pass", "fail"])
    .describe("程式碼是否真正滿足題目與測試意圖"),
  comments: z
    .array(z.string())
    .describe("給學生的 review 意見，繁體中文，每則一個重點"),
  weaknesses: z
    .array(
      z.object({
        criterion: z.string().describe("對應的 rubric criterion 原文"),
        summary: z.string().describe("一句話描述弱點本質"),
      }),
    )
    .describe("review 發現的弱點，沒有則空陣列"),
});

export type ReviewResult = z.infer<typeof reviewSchema>;

export async function generateExercise(
  lesson: PracticeLessonMeta,
): Promise<PracticeExercise> {
  const { object } = await generateObject({
    model: MODEL,
    schema: exerciseSchema,
    // ponytail: 格式漂移時重試一次就好，再失敗讓錯誤浮上去
    maxRetries: 1,
    prompt: `為 React 技能樹的實作型節點「${lesson.title}」出一道實作題。

考點範圍：
${lesson.examPoints.map((p) => `- ${p}`).join("\n")}

驗收標準（rubric）：
${lesson.rubric.map((r) => `- ${r.criterion}：${r.passCondition}`).join("\n")}

規則：
- 題目聚焦考點，一題涵蓋核心即可，30 分鐘內能完成。
- 程式碼一律 TypeScript。starterCode 的具名 export 是測試的進入點，含清楚的 TODO。
- testCode 在瀏覽器內的測試環境執行：只用全域 describe / it / expect（Jest 風格），絕對不要 import 任何測試框架或第三方套件；用相對路徑 import starterCode 的 export（檔名固定是 ./exercise）。
- 測試 4-6 條，涵蓋基本行為與至少一個邊界情況，測試名稱用繁體中文描述行為。
- description 簡短親切，先講情境再列要求，附一組輸入輸出範例。`,
  });
  return object;
}

export async function reviewCode(
  lesson: PracticeLessonMeta,
  exercise: PracticeExercise,
  userCode: string,
): Promise<ReviewResult> {
  const { object } = await generateObject({
    model: MODEL,
    schema: reviewSchema,
    maxRetries: 1,
    prompt: `你是資深 React 工程師，正在 review 學生對實作題的解答。

題目：
${exercise.description}

測試碼：
\`\`\`ts
${exercise.testCode}
\`\`\`

學生的程式碼：
\`\`\`ts
${userCode}
\`\`\`

驗收標準（rubric）：
${lesson.rubric.map((r) => `- ${r.criterion}：${r.passCondition}`).join("\n")}

任務：
1. 判定 verdict：程式碼是否真正實作了題目要求、能通過上述測試的意圖。空殼、硬編測資、與題目無關的程式碼一律 fail。
2. comments：2-4 則具體意見（命名、慣用寫法、邊界情況、可讀性），繁體中文、口語、對事不對人；verdict 為 fail 時要說明原因。
3. weaknesses：對照 rubric，程式碼暴露的觀念弱點；寫法瑕疵不算弱點，觀念誤解才算。沒有就給空陣列。`,
  });
  return object;
}
