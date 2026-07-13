import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { generateObject } from "ai";
import { z } from "zod";
import type { RubricItem } from "@/db/schema";
import type { CheckState, SessionPhase, StoredMessage } from "@/db/schema";

export const MODEL = "google/gemini-3-flash";

export type LessonMeta = {
  id: string;
  title: string;
  examPoints: string[];
  rubric: RubricItem[];
};

export type WeaknessFound = { criterion: string; summary: string };

const SessionState = Annotation.Root({
  lesson: Annotation<LessonMeta>,
  messages: Annotation<StoredMessage[]>,
  phase: Annotation<SessionPhase>,
  checkState: Annotation<CheckState>,
  nextLessonHint: Annotation<string>,
  // 輸出：route 用這段指示做最後的 streaming 回覆
  replyInstructions: Annotation<string>,
  newWeaknesses: Annotation<WeaknessFound[]>,
});

export type SessionGraphState = typeof SessionState.State;

function pendingCriteria(state: SessionGraphState): RubricItem[] {
  return state.lesson.rubric.filter(
    (r) => !state.checkState.criterionPassed[r.criterion],
  );
}

function teachNode(state: SessionGraphState) {
  const points = state.lesson.examPoints.map((p) => `- ${p}`).join("\n");
  return {
    phase: "check" as const,
    replyInstructions: `現在是教學階段。針對本節點考點教學：
${points}
教學要精煉、用貼近實際開發的例子。結尾提出一個蘇格拉底式檢核問題，讓學生用自己的話解釋核心概念。不要直接給答案。`,
  };
}

async function evaluateNode(state: SessionGraphState) {
  const pending = pendingCriteria(state);
  const recent = state.messages
    .slice(-8)
    .map((m) => `${m.role === "user" ? "學生" : "老師"}：${m.content}`)
    .join("\n");

  const { object } = await generateObject({
    model: MODEL,
    schema: z.object({
      results: z.array(
        z.object({
          criterion: z.string().describe("原文照抄的 criterion"),
          passed: z.boolean(),
          misconception: z
            .string()
            .describe("未通過時，一句話描述學生誤解的本質；通過時給空字串"),
        }),
      ),
    }),
    prompt: `你是檢核引擎。根據對話中學生最新的回答，逐項判定下列 rubric criterion 是否滿足 passCondition。嚴格依 passCondition 判定，不要放水也不要苛求 passCondition 沒要求的東西。

Rubric：
${pending.map((r) => `- criterion: ${r.criterion}\n  passCondition: ${r.passCondition}`).join("\n")}

對話（節點「${state.lesson.title}」）：
${recent}`,
  });

  const criterionPassed = { ...state.checkState.criterionPassed };
  const newWeaknesses: WeaknessFound[] = [];
  for (const r of object.results) {
    if (r.passed) {
      criterionPassed[r.criterion] = true;
    } else {
      newWeaknesses.push({
        criterion: r.criterion,
        summary: r.misconception || "未能滿足過關條件",
      });
    }
  }

  const allPassed = state.lesson.rubric.every((r) => criterionPassed[r.criterion]);
  return {
    checkState: {
      criterionPassed,
      failedAttempts:
        state.checkState.failedAttempts + (newWeaknesses.length > 0 ? 1 : 0),
    },
    newWeaknesses,
    phase: (allPassed ? "passed" : "reteach") as SessionPhase,
  };
}

function reteachNode(state: SessionGraphState) {
  const failed = pendingCriteria(state);
  return {
    phase: "check" as const,
    replyInstructions: `學生的回答未通過以下檢核點：
${failed.map((r) => `- ${r.criterion}（過關條件：${r.passCondition}）`).join("\n")}
先肯定答對的部分，然後換一個不同的角度（比喻、反例、或更小的步驟）重新解釋未通過的概念。這是第 ${state.checkState.failedAttempts} 次未過，角度要跟之前明顯不同。結尾再次提出檢核問題。不要直接給答案。`,
  };
}

function passNode(state: SessionGraphState) {
  return {
    replyInstructions: `學生已通過本節點全部檢核，恭喜他過關。簡短總結他掌握了什麼。${state.nextLessonHint}`,
  };
}

const builder = new StateGraph(SessionState)
  .addNode("teach", teachNode)
  .addNode("evaluate", evaluateNode)
  .addNode("reteach", reteachNode)
  .addNode("pass", passNode)
  .addConditionalEdges(START, (s: SessionGraphState) =>
    s.phase === "teach" ? "teach" : "evaluate",
  )
  .addConditionalEdges("evaluate", (s: SessionGraphState) =>
    s.phase === "passed" ? "pass" : "reteach",
  )
  .addEdge("teach", END)
  .addEdge("reteach", END)
  .addEdge("pass", END);

export const sessionGraph = builder.compile();

export function systemPrompt(lesson: LessonMeta, replyInstructions: string) {
  return `你是「Mycareer」技能樹的 AI 導師，正在帶學生上「${lesson.title}」這個 React 概念節點。用繁體中文、口語但精確，程式碼範例用 TypeScript。

${replyInstructions}`;
}
