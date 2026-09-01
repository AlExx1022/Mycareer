"use client";

import { useState } from "react";
import type { ClientQuestion, QuestionData } from "@/lib/lesson-session/units";
import { renderPromptContent } from "./code-prompt";

export type Feedback = { correct: boolean; text: string };

// 糖果色 3D 按鈕：底部陰影模擬立體、按下時位移貼平（呼應技能樹的路線配色）
const BTN_3D =
  "block w-full rounded-xl border-2 px-4 py-3 text-left text-[15px] font-semibold transition-all duration-150 active:translate-y-[3px] active:shadow-none disabled:pointer-events-none";

type OptionState = "idle" | "checking" | "correct" | "wrong";

function optionClass(state: OptionState) {
  switch (state) {
    case "checking":
      return `${BTN_3D} border-[#1CB0F6] bg-[#1CB0F6]/10 text-[#17242D] shadow-[0_3px_0_0_#1899D6] opacity-90`;
    case "correct":
      return `${BTN_3D} border-green-500 bg-green-50 text-green-700 shadow-[0_3px_0_0_#22c55e]`;
    case "wrong":
      return `${BTN_3D} border-amber-500 bg-amber-50 text-amber-800 shadow-[0_3px_0_0_#f59e0b] animate-[shake_0.4s_ease-in-out]`;
    default:
      return `${BTN_3D} border-[#17242D]/15 bg-white text-[#17242D] shadow-[0_3px_0_0_rgba(23,36,45,0.12)] hover:border-[#17242D]/30 disabled:opacity-40 disabled:shadow-none`;
  }
}

export function ChoiceWidget({
  q,
  feedback,
  onAnswer,
  busy,
}: {
  q: Extract<ClientQuestion, { type: "choice" }>;
  feedback: Feedback | null;
  onAnswer: (a: unknown) => void;
  busy: boolean;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className="mt-3 space-y-2">
      {q.options.map((opt, i) => {
        const isPicked = picked === i;
        const state: OptionState = !isPicked
          ? "idle"
          : feedback === null
            ? "checking"
            : feedback.correct
              ? "correct"
              : "wrong";
        return (
          <button
            key={i}
            onClick={() => {
              setPicked(i);
              onAnswer(i);
            }}
            disabled={busy}
            className={optionClass(state)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function FillWidget({
  onAnswer,
  busy,
}: {
  onAnswer: (a: unknown) => void;
  busy: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onAnswer(value);
      }}
      className="mt-3 flex gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="填入答案⋯"
        className="flex-1 rounded-lg border border-[#17242D]/20 px-4 py-3 font-mono text-[15px] outline-none focus:border-[#17242D]/50"
      />
      <button
        type="submit"
        disabled={busy || !value.trim()}
        className="rounded-lg bg-[#17242D] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        送出
      </button>
    </form>
  );
}

export function FreeWidget({
  onAnswer,
  busy,
}: {
  onAnswer: (a: unknown) => void;
  busy: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onAnswer(value);
      }}
      className="mt-3"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="用自己的話回答⋯"
        rows={3}
        className="w-full rounded-lg border border-[#17242D]/20 px-4 py-3 text-[15px] outline-none focus:border-[#17242D]/50"
      />
      <button
        type="submit"
        disabled={busy || !value.trim()}
        className="mt-2 rounded-lg bg-[#17242D] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        送出
      </button>
    </form>
  );
}

// 配對連線色：與技能樹路線同色系，讓左右兩側同一組看得出來是配對的
const PAIR_COLORS = [
  { c: "#1CB0F6", d: "#1899D6" },
  { c: "#58CC02", d: "#46A302" },
  { c: "#CE82FF", d: "#A568CC" },
  { c: "#FF9600", d: "#E08600" },
];

function pairStyle(i: number) {
  const { c, d } = PAIR_COLORS[i % PAIR_COLORS.length];
  return {
    borderColor: c,
    backgroundColor: `${c}1A`,
    boxShadow: `0 3px 0 0 ${d}`,
  };
}

export function MatchWidget({
  q,
  feedback,
  onAnswer,
  busy,
}: {
  q: Extract<ClientQuestion, { type: "match" }>;
  feedback: Feedback | null;
  onAnswer: (a: unknown) => void;
  busy: boolean;
}) {
  // picks[i] = 左側第 i 項配到的右側顯示位置
  const [picks, setPicks] = useState<(number | null)[]>(
    q.lefts.map(() => null),
  );
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  // 送出配對後才進入「檢查中／結果」狀態；動到配對就視為在修正，退回編輯態
  const [submitted, setSubmitted] = useState(false);
  const usedRights = new Set(picks.filter((p) => p !== null));
  const complete = picks.every((p) => p !== null);

  const checking = submitted && feedback === null;
  const wrong = submitted && feedback?.correct === false;
  const correct = submitted && feedback?.correct === true;

  return (
    <div
      className={`mt-3 rounded-xl p-1 transition-all ${
        checking ? "animate-pulse" : ""
      } ${wrong ? "animate-[shake_0.4s_ease-in-out] bg-amber-50" : ""} ${
        correct ? "bg-green-50" : ""
      }`}
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {q.lefts.map((l, i) => {
            const matched = picks[i] !== null;
            return (
              <button
                key={i}
                onClick={() => setSelectedLeft(i)}
                disabled={busy}
                style={matched && !checking ? pairStyle(i) : undefined}
                className={`block w-full rounded-xl border-2 px-3 py-2 text-left text-sm font-medium transition-all duration-150 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none ${
                  selectedLeft === i
                    ? "border-[#17242D] bg-[#17242D] text-white shadow-[0_3px_0_0_#000]"
                    : matched
                      ? "text-[#17242D]"
                      : "border-[#17242D]/15 bg-white text-[#17242D] shadow-[0_3px_0_0_rgba(23,36,45,0.12)] hover:border-[#17242D]/30 disabled:opacity-40 disabled:shadow-none"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {q.rights.map((r, j) => {
            const pairIndex = picks.findIndex((p) => p === j);
            const matched = pairIndex !== -1;
            return (
              <button
                key={j}
                onClick={() => {
                  if (selectedLeft === null) return;
                  setPicks((prev) =>
                    prev.map((p, i) => (i === selectedLeft ? j : p)),
                  );
                  setSelectedLeft(null);
                  setSubmitted(false);
                }}
                disabled={busy || selectedLeft === null || usedRights.has(j)}
                style={matched && !checking ? pairStyle(pairIndex) : undefined}
                className={`block w-full rounded-xl border-2 px-3 py-2 text-left text-sm font-medium transition-all duration-150 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none ${
                  matched
                    ? "text-[#17242D]"
                    : "border-[#17242D]/15 bg-white text-[#17242D] shadow-[0_3px_0_0_rgba(23,36,45,0.12)] hover:border-[#17242D]/30 disabled:opacity-40 disabled:shadow-none"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            setSubmitted(true);
            onAnswer(picks);
          }}
          disabled={busy || !complete}
          className="rounded-lg bg-[#17242D] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          送出配對
        </button>
        <button
          onClick={() => {
            setPicks(q.lefts.map(() => null));
            setSelectedLeft(null);
            setSubmitted(false);
          }}
          disabled={busy}
          className="rounded-lg border border-[#17242D]/20 px-5 py-2 text-sm hover:border-[#17242D]/60 disabled:opacity-50"
        >
          重設
        </button>
      </div>
      <p className="mt-2 text-xs text-[#17242D]/45">
        先點左邊、再點右邊完成配對
      </p>
    </div>
  );
}

export function QuestionWidget({
  q,
  feedback,
  onAnswer,
  busy,
}: {
  q: ClientQuestion;
  feedback: Feedback | null;
  onAnswer: (a: unknown) => void;
  busy: boolean;
}) {
  return (
    <>
      {q.type === "choice" && (
        <ChoiceWidget key={q.id} q={q} feedback={feedback} onAnswer={onAnswer} busy={busy} />
      )}
      {q.type === "fill" && <FillWidget onAnswer={onAnswer} busy={busy} />}
      {q.type === "match" && (
        <MatchWidget key={q.id} q={q} feedback={feedback} onAnswer={onAnswer} busy={busy} />
      )}
      {q.type === "free" && <FreeWidget onAnswer={onAnswer} busy={busy} />}
    </>
  );
}

// 難度標籤由單元順序推導（考點已依難度遞進排序）：首=基礎、末=深入、中間=進階
function unitLevel(unit: number, total: number): string | null {
  if (total < 2) return null;
  if (unit === 1) return "基礎";
  if (unit === total && total >= 3) return "深入";
  return "進階";
}

export function QuestionCard({
  data,
  feedback,
  onAnswer,
  busy,
}: {
  data: QuestionData;
  feedback: Feedback | null;
  onAnswer: (a: unknown) => void;
  busy: boolean;
}) {
  const { question: q, progress: p } = data;
  const level = unitLevel(p.unit, p.totalUnits);
  return (
    <div className="mt-6 rounded-lg border border-[#17242D]/15 p-4">
      <p className="font-mono text-xs text-[#17242D]/45">
        單元 {p.unit}/{p.totalUnits}
        {level && (
          <span className="mx-1 rounded bg-[#17242D]/10 px-1.5 py-0.5">
            {level}
          </span>
        )}
        ・ 第 {p.question}/{p.totalQuestions} 題
      </p>
      <div className="mt-2 text-[15px]">{renderPromptContent(q.prompt)}</div>
      <QuestionWidget q={q} feedback={feedback} onAnswer={onAnswer} busy={busy} />
      {feedback && (
        <p
          className={`mt-3 rounded-lg px-4 py-2 text-sm ${
            feedback.correct
              ? "bg-green-50 text-green-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {feedback.correct ? "✓ 答對了！" : `✗ 再想想。${feedback.text}`}
        </p>
      )}
    </div>
  );
}
