"use client";

import { useState } from "react";
import type { ClientQuestion } from "@/lib/lesson-session/units";

export type Feedback = { correct: boolean; text: string };

export function ChoiceWidget({
  q,
  onAnswer,
  busy,
}: {
  q: Extract<ClientQuestion, { type: "choice" }>;
  onAnswer: (a: unknown) => void;
  busy: boolean;
}) {
  return (
    <div className="mt-3 space-y-2">
      {q.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onAnswer(i)}
          disabled={busy}
          className="block w-full rounded-lg border border-[#17242D]/20 px-4 py-3 text-left text-[15px] hover:border-[#17242D]/60 disabled:opacity-50"
        >
          {opt}
        </button>
      ))}
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

export function MatchWidget({
  q,
  onAnswer,
  busy,
}: {
  q: Extract<ClientQuestion, { type: "match" }>;
  onAnswer: (a: unknown) => void;
  busy: boolean;
}) {
  // picks[i] = 左側第 i 項配到的右側顯示位置
  const [picks, setPicks] = useState<(number | null)[]>(
    q.lefts.map(() => null),
  );
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const usedRights = new Set(picks.filter((p) => p !== null));
  const complete = picks.every((p) => p !== null);

  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {q.lefts.map((l, i) => (
            <button
              key={i}
              onClick={() => setSelectedLeft(i)}
              disabled={busy}
              className={`block w-full rounded-lg border px-3 py-2 text-left text-sm disabled:opacity-50 ${
                selectedLeft === i
                  ? "border-[#17242D] bg-[#17242D] text-white"
                  : "border-[#17242D]/20"
              }`}
            >
              {l}
              {picks[i] !== null && (
                <span className="mt-1 block text-xs opacity-60">
                  → {q.rights[picks[i]]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {q.rights.map((r, j) => (
            <button
              key={j}
              onClick={() => {
                if (selectedLeft === null) return;
                setPicks((prev) =>
                  prev.map((p, i) => (i === selectedLeft ? j : p)),
                );
                setSelectedLeft(null);
              }}
              disabled={busy || selectedLeft === null || usedRights.has(j)}
              className="block w-full rounded-lg border border-[#17242D]/20 px-3 py-2 text-left text-sm hover:border-[#17242D]/60 disabled:opacity-40"
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onAnswer(picks)}
          disabled={busy || !complete}
          className="rounded-lg bg-[#17242D] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          送出配對
        </button>
        <button
          onClick={() => {
            setPicks(q.lefts.map(() => null));
            setSelectedLeft(null);
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
  onAnswer,
  busy,
}: {
  q: ClientQuestion;
  onAnswer: (a: unknown) => void;
  busy: boolean;
}) {
  return (
    <>
      {q.type === "choice" && (
        <ChoiceWidget q={q} onAnswer={onAnswer} busy={busy} />
      )}
      {q.type === "fill" && <FillWidget onAnswer={onAnswer} busy={busy} />}
      {q.type === "match" && (
        <MatchWidget key={q.id} q={q} onAnswer={onAnswer} busy={busy} />
      )}
      {q.type === "free" && <FreeWidget onAnswer={onAnswer} busy={busy} />}
    </>
  );
}
