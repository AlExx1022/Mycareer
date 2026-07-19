"use client";

import { useState } from "react";
import Link from "next/link";
import type { ClientQuestion } from "@/lib/lesson-session/units";
import { QuestionWidget, type Feedback } from "@/app/question-widgets";

type Active = {
  question: ClientQuestion;
  progress: { question: number; totalQuestions: number };
};

export default function ReviewSession({
  slug,
  initial,
}: {
  slug: string;
  initial: Active | null;
}) {
  const [active, setActive] = useState<Active | null>(initial);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/review/${slug}/start`, { method: "POST" });
      if (!res.ok) {
        setError((await res.text()) || "出了點問題，請再試一次。");
        return;
      }
      setActive(await res.json());
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer(answer: unknown) {
    if (!active || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/review/${slug}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: active.question.id, answer }),
      });
      if (!res.ok) {
        setFeedback({
          correct: false,
          text: (await res.text()) || "出了點問題，請再試一次。",
        });
        return;
      }
      const d = await res.json();
      if (!d.correct) {
        setFeedback({ correct: false, text: d.explanation });
      } else if (d.done) {
        setFeedback(null);
        setActive(null);
        setScore(d.score);
      } else {
        setFeedback(null);
        setActive({ question: d.next, progress: d.progress });
      }
    } finally {
      setBusy(false);
    }
  }

  if (score !== null) {
    return (
      <div className="mt-8 rounded-xl bg-[#17242D] px-6 py-8 text-center text-white">
        <p className="text-3xl">🔧</p>
        <p className="mt-2 font-semibold">修好了！記憶回到 {score}%</p>
        <p className="mt-1 text-sm opacity-70">
          {score === 100
            ? "全部一次答對，這個概念很牢。"
            : "答錯的地方已記進弱點，下次複習會再考你。"}
        </p>
        <div className="mt-5 flex justify-center gap-3 text-sm font-medium">
          <Link
            href="/review"
            className="rounded-lg bg-white/15 px-4 py-2 hover:bg-white/25"
          >
            回複習佇列
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-white px-4 py-2 text-[#17242D] hover:opacity-90"
          >
            看技能樹 →
          </Link>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="mt-8 rounded-xl border border-[#17242D]/10 bg-white p-6">
        <p className="text-sm text-[#17242D]/70">
          針對你之前在這個節點的弱點出 3–5 題，答完記憶就修好了。
        </p>
        {error && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {error}
          </p>
        )}
        <button
          onClick={start}
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-[#17242D] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "出題中⋯" : "開始複習"}
        </button>
      </div>
    );
  }

  const { question: q, progress: p } = active;
  return (
    <div className="mt-6 rounded-xl border border-[#17242D]/15 bg-white p-4">
      <p className="font-mono text-xs text-[#17242D]/45">
        第 {p.question}/{p.totalQuestions} 題
      </p>
      <p className="mt-2 text-[15px] whitespace-pre-wrap">{q.prompt}</p>
      <QuestionWidget q={q} onAnswer={submitAnswer} busy={busy} />
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
