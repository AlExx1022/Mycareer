"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { PracticeResultPanel } from "@/app/lesson/[slug]/practice-result";
import { JAVASCRIPT_LAB_FIXTURES } from "@/lib/practice-session/javascript-lab-fixtures";
import type { PracticeRunnerResult } from "@/lib/practice-session/runner";

const SandpackPracticeRunner = dynamic(
  () => import("@/app/lesson/[slug]/practice-sandpack-runner"),
  { ssr: false },
);

export default function JavaScriptLabsPreviewPage() {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<PracticeRunnerResult | null>(null);
  const fixture = JAVASCRIPT_LAB_FIXTURES[index];
  const handleResult = useCallback(
    (nextResult: PracticeRunnerResult | null) => setResult(nextResult),
    [],
  );
  const ignoreFilesChange = useCallback(() => {}, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs text-[#17242D]/45">
        /dev/javascript-labs-preview · 固定解答與測試，不呼叫 API／DB／LLM
      </p>
      <h1 className="mt-1 text-2xl font-bold">JavaScript Interview Labs 驗收</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {JAVASCRIPT_LAB_FIXTURES.map((item, itemIndex) => (
          <button
            type="button"
            key={item.lessonId}
            onClick={() => {
              setIndex(itemIndex);
              setResult(null);
            }}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
              itemIndex === index
                ? "border-[#17242D] bg-[#17242D] text-white"
                : "border-[#17242D]/20 text-[#17242D]/60"
            }`}
          >
            {item.lessonId}
          </button>
        ))}
      </div>
      <h2 className="mt-4 text-lg font-semibold">{fixture.title}</h2>
      <p className="mb-4 text-sm text-[#17242D]/60">
        {fixture.workspace.description}
      </p>
      <SandpackPracticeRunner
        key={fixture.lessonId}
        runtime="vanilla-js"
        workspace={fixture.workspace}
        initialUserFiles={{}}
        onFilesChange={ignoreFilesChange}
        onResult={handleResult}
      />
      <PracticeResultPanel result={result} />
    </main>
  );
}
