"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

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

export default function LessonChat({
  slug,
  initialMessages,
  passed,
}: {
  slug: string;
  initialMessages: UIMessage[];
  passed: boolean;
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: `/api/lesson/${slug}/chat` }),
    messages: initialMessages,
  });
  const busy = status === "submitted" || status === "streaming";

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

      {messages.length === 0 ? (
        <button
          onClick={() => sendMessage({ text: "我準備好了，開始上課吧！" })}
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-[#17242D] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          開始上課
        </button>
      ) : (
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
      )}
    </div>
  );
}
