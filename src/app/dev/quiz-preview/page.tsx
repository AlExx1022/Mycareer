"use client";

import { useState } from "react";
import { QuestionCard, type Feedback } from "@/app/question-widgets";
import { renderPromptContent } from "@/app/code-prompt";
import type { ClientQuestion, QuestionProgress } from "@/lib/lesson-session/units";

// 假資料頁：不打真的 API/DB，純粹讓真正的 QuestionCard/QuestionWidget 元件跑起來給你調樣式
type MockItem = {
  q: ClientQuestion;
  progress: QuestionProgress;
  judge: (answer: unknown) => boolean;
  explanation: string;
  hint: string;
};

const MATCH_LEFTS = ["useState", "useEffect", "useMemo", "useRef"];
const MATCH_RIGHTS = ["保存跨渲染的可變值", "管理狀態", "記憶計算結果", "處理副作用"];
const MATCH_ANSWER = [1, 3, 2, 0]; // picks[i] = 第 i 個左側項目應配到的右側 index

const ITEMS: MockItem[] = [
  {
    q: {
      id: "preview-choice",
      type: "choice",
      prompt:
        "讀一下這段程式碼：\n```ts\nfunction add(a: number, b: number) {\n  return a + b;\n}\n```\n呼叫 `add(2, 3)` 的回傳值是？",
      options: ["5", "6", "undefined", "TypeError"],
    },
    progress: { unit: 1, totalUnits: 3, question: 1, totalQuestions: 4 },
    judge: (a) => a === 0,
    explanation: "函式直接回傳兩數相加，2 + 3 = 5。",
    hint: "正解：選項 1「5」",
  },
  {
    q: {
      id: "preview-fill",
      type: "fill",
      prompt: "React 用來管理元件內部狀態的 Hook 叫 `use___`。",
    },
    progress: { unit: 2, totalUnits: 3, question: 2, totalQuestions: 4 },
    judge: (a) => typeof a === "string" && a.trim().toLowerCase() === "state",
    explanation: "答案是 useState，補的字是 state。",
    hint: "正解：state",
  },
  {
    q: {
      id: "preview-match",
      type: "match",
      prompt: "把 Hook 跟它的用途配對起來。",
      lefts: MATCH_LEFTS,
      rights: MATCH_RIGHTS,
    },
    progress: { unit: 2, totalUnits: 3, question: 3, totalQuestions: 4 },
    judge: (a) =>
      Array.isArray(a) &&
      a.length === MATCH_ANSWER.length &&
      a.every((p, i) => p === MATCH_ANSWER[i]),
    explanation: "再對照一次每個 Hook 實際在做的事。",
    hint: "正解：useState→管理狀態、useEffect→處理副作用、useMemo→記憶計算結果、useRef→保存跨渲染的可變值",
  },
  {
    q: {
      id: "preview-free",
      type: "free",
      prompt: "用一兩句話說說 useEffect 的 cleanup function 什麼時候會執行？",
    },
    progress: { unit: 3, totalUnits: 3, question: 4, totalQuestions: 4 },
    judge: (a) => typeof a === "string" && a.trim().length > 5,
    explanation: "太短的回答判定為答錯，方便測試錯誤樣式；正常寫完一句話就會過。",
    hint: "正解：隨便寫超過 5 個字都算對，方便測樣式",
  },
];

const MOCK_PRACTICE_DESCRIPTION = `情境：你要幫一個購物車元件計算總金額。

要求：
- 實作 \`calcTotal\` 函式，輸入 \`CartItem[]\`，回傳總金額（數字）。
- 若購物車是空陣列，回傳 0。

輸入輸出範例：
\`\`\`ts
calcTotal([{ price: 100, qty: 2 }, { price: 50, qty: 1 }])
// 回傳 250
\`\`\`
`;

const FLASH_MS = 600;
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function QuizPreviewPage() {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const item = ITEMS[index];

  function goto(i: number) {
    setIndex(i);
    setFeedback(null);
    setBusy(false);
  }

  async function fakeSubmit(answer: unknown) {
    if (busy) return;
    setBusy(true);
    await wait(400); // 模擬網路延遲，讓 checking 狀態看得到
    if (item.judge(answer)) {
      setFeedback({ correct: true, text: "" });
      await wait(FLASH_MS);
      setFeedback(null);
      goto((index + 1) % ITEMS.length);
      return;
    }
    setFeedback({ correct: false, text: item.explanation });
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="font-mono text-xs text-[#17242D]/45">
        /dev/quiz-preview ・ 假資料頁，只用來調樣式，不會打 API
      </p>
      <h1 className="mt-1 text-2xl font-bold">題目樣式預覽</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {ITEMS.map((it, i) => (
          <button
            key={it.q.id}
            onClick={() => goto(i)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              i === index
                ? "border-[#17242D] bg-[#17242D] text-white"
                : "border-[#17242D]/20 text-[#17242D]/60 hover:border-[#17242D]/40"
            }`}
          >
            {it.q.type}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-[#17242D]/45">{item.hint}</p>

      <QuestionCard
        data={{ question: item.q, progress: item.progress }}
        feedback={feedback}
        onAnswer={fakeSubmit}
        busy={busy}
      />

      <h2 className="mt-10 text-sm font-semibold text-[#17242D]/70">
        實作題說明樣式（practice-session 用）
      </h2>
      <div className="mt-2 rounded-lg border border-[#17242D]/15 px-4 py-3 text-[15px]">
        {renderPromptContent(MOCK_PRACTICE_DESCRIPTION)}
      </div>
    </main>
  );
}
