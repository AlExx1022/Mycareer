"use client";

import { useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type {
  ClientQuestion,
  QuestionData,
} from "@/lib/lesson-session/units";

gsap.registerPlugin(useGSAP);

// ponytail: 只處理下一站推薦連結用到的 [text](url)，不引入 markdown 套件
function renderWithLinks(text: string) {
  const parts = text.split(/(\[[^\]]+\]\(\/[^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\((\/[^)]+)\)$/);
    return m ? (
      <a key={i} href={m[2]} className="font-semibold underline">
        {m[1]}
      </a>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}

type Feedback = { correct: boolean; text: string };

function ChoiceWidget({
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

function FillWidget({
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

function FreeWidget({
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

function MatchWidget({
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

function QuestionCard({
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
  return (
    <div className="mt-6 rounded-lg border border-[#17242D]/15 p-4">
      <p className="font-mono text-xs text-[#17242D]/45">
        單元 {p.unit}/{p.totalUnits} ・ 第 {p.question}/{p.totalQuestions} 題
      </p>
      <p className="mt-2 text-[15px] whitespace-pre-wrap">{q.prompt}</p>
      {q.type === "choice" && (
        <ChoiceWidget q={q} onAnswer={onAnswer} busy={busy} />
      )}
      {q.type === "fill" && <FillWidget onAnswer={onAnswer} busy={busy} />}
      {q.type === "match" && (
        <MatchWidget key={q.id} q={q} onAnswer={onAnswer} busy={busy} />
      )}
      {q.type === "free" && <FreeWidget onAnswer={onAnswer} busy={busy} />}
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

function Celebration({
  all,
  onDone,
}: {
  all: boolean;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo(
      ref.current,
      { scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" },
    );
    gsap.to(ref.current, {
      opacity: 0,
      delay: 1.3,
      duration: 0.3,
      onComplete: onDone,
    });
  });
  return (
    <div
      ref={ref}
      className="mt-6 rounded-lg bg-[#17242D] px-6 py-8 text-center text-white"
    >
      <p className="text-3xl">{all ? "🏆" : "🎉"}</p>
      <p className="mt-2 font-semibold">
        {all ? "所有單元完成！" : "單元完成！"}
      </p>
      <p className="mt-1 text-sm opacity-70">
        {all ? "接下來做個小檢核就過關了" : "休息一下，馬上進下一單元"}
      </p>
    </div>
  );
}

export default function LessonChat({
  slug,
  initialMessages,
  passed,
  initialQuestion,
}: {
  slug: string;
  initialMessages: UIMessage[];
  passed: boolean;
  initialQuestion: QuestionData | null;
}) {
  const [input, setInput] = useState("");
  const [active, setActive] = useState<QuestionData | null>(initialQuestion);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [celebrating, setCelebrating] = useState<"unit" | "all" | null>(null);
  const [answering, setAnswering] = useState(false);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: `/api/lesson/${slug}/chat` }),
    messages: initialMessages,
    onData: (part) => {
      if (part.type === "data-question") {
        setActive(part.data as QuestionData);
        setFeedback(null);
      }
    },
  });
  const busy = status === "submitted" || status === "streaming";

  async function submitAnswer(answer: unknown) {
    if (!active || answering) return;
    setAnswering(true);
    try {
      const res = await fetch(`/api/lesson/${slug}/answer`, {
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
      } else if (d.next) {
        setFeedback(null);
        setActive({ question: d.next, progress: d.progress });
      } else if (d.unitComplete) {
        setFeedback(null);
        setActive(null);
        setCelebrating(d.allUnitsComplete ? "all" : "unit");
      }
    } finally {
      setAnswering(false);
    }
  }

  return (
    <div className="mt-8">
      {passed && (
        <p className="mb-4 inline-block rounded-full bg-[#17242D] px-3 py-1 text-xs font-semibold text-white">
          ✓ 已通過檢核
        </p>
      )}

      <div className="space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-lg bg-[#17242D] px-4 py-3 text-[15px] text-white"
                : "mr-8 rounded-lg border border-[#17242D]/15 px-4 py-3 text-[15px] whitespace-pre-wrap"
            }
          >
            {m.parts.map((p, i) =>
              p.type === "text" ? (
                <span key={i}>
                  {m.role === "assistant" ? renderWithLinks(p.text) : p.text}
                </span>
              ) : null,
            )}
          </div>
        ))}

        {status === "submitted" && (
          <p className="mr-8 px-4 text-sm text-[#17242D]/45">思考中⋯</p>
        )}
        {error && (
          <p className="mr-8 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.message || "出了點問題，請再試一次。"}
          </p>
        )}
      </div>

      {celebrating && (
        <Celebration
          all={celebrating === "all"}
          onDone={() => {
            const all = celebrating === "all";
            setCelebrating(null);
            sendMessage({
              text: all ? "我完成所有單元了！" : "繼續下一個單元！",
            });
          }}
        />
      )}

      {active && !busy && !celebrating && (
        <QuestionCard
          data={active}
          feedback={feedback}
          onAnswer={submitAnswer}
          busy={answering}
        />
      )}

      {messages.length === 0 ? (
        <button
          onClick={() => sendMessage({ text: "我準備好了，開始上課吧！" })}
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-[#17242D] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          開始上課
        </button>
      ) : (
        !active &&
        !celebrating && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() || busy) return;
              sendMessage({ text: input });
              setInput("");
            }}
            className="mt-6 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="輸入你的回答⋯"
              className="flex-1 rounded-lg border border-[#17242D]/20 px-4 py-3 text-[15px] outline-none focus:border-[#17242D]/50"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-lg bg-[#17242D] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              送出
            </button>
          </form>
        )
      )}
    </div>
  );
}
