"use client";

import { useEffect, useRef, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackTests,
  useSandpack,
} from "@codesandbox/sandpack-react";
import type { PracticeExercise, PracticeStatus } from "@/db/schema";

// onComplete 回傳的測試結果樹（sandpack 未 export，取用到的最小形狀）
type TestNode = {
  status: string;
  name: string;
};
type DescribeNode = {
  tests?: Record<string, TestNode>;
  describes?: Record<string, DescribeNode>;
  error?: unknown;
};

function collectTests(node: DescribeNode): TestNode[] {
  return [
    ...Object.values(node.tests ?? {}),
    ...Object.values(node.describes ?? {}).flatMap(collectTests),
  ];
}

function allTestsPass(specs: Record<string, DescribeNode>): boolean {
  const roots = Object.values(specs);
  if (roots.some((s) => s.error)) return false;
  const tests = roots.flatMap(collectTests);
  return tests.length > 0 && tests.every((t) => t.status === "pass");
}

type ReviewResponse = {
  verdict: "pass" | "fail";
  comments: string[];
  next: { id: string; title: string } | null;
};

const EXERCISE_FILE = "/exercise.ts";

// 編輯器內側：自動儲存 + 送審按鈕（需要 useSandpack 拿最新程式碼）
function EditorControls({
  slug,
  testsPassed,
  reviewing,
  passed,
  onSubmit,
}: {
  slug: string;
  testsPassed: boolean;
  reviewing: boolean;
  passed: boolean;
  onSubmit: (code: string) => void;
}) {
  const { sandpack } = useSandpack();
  const code = sandpack.files[EXERCISE_FILE]?.code ?? "";
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/lesson/${slug}/practice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [code, slug]);

  if (passed) return null;
  return (
    <button
      onClick={() => onSubmit(code)}
      disabled={!testsPassed || reviewing}
      className="mt-3 w-full rounded-lg bg-[#17242D] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
    >
      {reviewing
        ? "AI review 中⋯"
        : testsPassed
          ? "測試全過，送出 AI review"
          : "先讓所有測試通過"}
    </button>
  );
}

export default function PracticeSession({ slug }: { slug: string }) {
  const [exercise, setExercise] = useState<PracticeExercise | null>(null);
  const [initialCode, setInitialCode] = useState("");
  const [status, setStatus] = useState<PracticeStatus>("in_progress");
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const [testsPassed, setTestsPassed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<ReviewResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/lesson/${slug}/practice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerate: generation > 0 }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setExercise(data.exercise);
        setInitialCode(data.userCode);
        setStatus(data.status);
        setTestsPassed(false);
        setReview(null);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [slug, generation]);

  async function submitReview(code: string) {
    setReviewing(true);
    try {
      const res = await fetch(`/api/lesson/${slug}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: ReviewResponse = await res.json();
      setReview(data);
      if (data.verdict === "pass") setStatus("passed");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setReviewing(false);
    }
  }

  if (error) {
    return (
      <div className="mt-10 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!exercise) {
    return (
      <p className="mt-10 text-sm text-[#17242D]/45">
        AI 出題中，第一次會花上幾秒⋯
      </p>
    );
  }

  const passed = status === "passed";

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_3fr]">
      <div>
        {passed && (
          <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            🎉 過關！這個節點已在技能樹上亮燈。
            {review?.next && (
              <a
                href={`/lesson/${review.next.id}`}
                className="ml-1 underline"
              >
                下一站：{review.next.title}
              </a>
            )}
          </div>
        )}
        <h2 className="text-sm font-semibold text-[#17242D]/70">題目</h2>
        <div className="mt-2 rounded-lg border border-[#17242D]/15 px-4 py-3 text-[15px] whitespace-pre-wrap">
          {exercise.description}
        </div>
        {review && (
          <>
            <h2 className="mt-6 text-sm font-semibold text-[#17242D]/70">
              AI review{review.verdict === "fail" && "（未過，改完再送一次）"}
            </h2>
            <ul className="mt-2 space-y-2">
              {review.comments.map((c) => (
                <li
                  key={c}
                  className="rounded-lg border border-[#17242D]/15 px-4 py-3 text-sm whitespace-pre-wrap"
                >
                  {c}
                </li>
              ))}
            </ul>
          </>
        )}
        {!passed && (
          <button
            onClick={() => {
              if (confirm("重新出題會捨棄目前的題目與程式碼，確定？")) {
                setExercise(null);
                setError(null);
                setGeneration((g) => g + 1);
              }
            }}
            className="mt-6 text-xs text-[#17242D]/45 underline hover:text-[#17242D]"
          >
            題目怪怪的？重新出題
          </button>
        )}
      </div>

      <SandpackProvider
        key={generation}
        template="react-ts"
        files={{
          [EXERCISE_FILE]: initialCode,
          "/exercise.test.ts": { code: exercise.testCode, readOnly: true },
        }}
        options={{
          visibleFiles: [EXERCISE_FILE, "/exercise.test.ts"],
          activeFile: EXERCISE_FILE,
        }}
      >
        <SandpackLayout style={{ flexDirection: "column" }}>
          <SandpackCodeEditor showLineNumbers style={{ height: 360 }} />
          <SandpackTests
            watchMode
            onComplete={(specs) => setTestsPassed(allTestsPass(specs))}
            style={{ height: 220 }}
          />
        </SandpackLayout>
        <EditorControls
          slug={slug}
          testsPassed={testsPassed}
          reviewing={reviewing}
          passed={passed}
          onSubmit={submitReview}
        />
      </SandpackProvider>
    </div>
  );
}
