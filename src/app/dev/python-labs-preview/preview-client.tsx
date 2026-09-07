"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import {
  PracticeEditorControls,
  PracticeResultPanel,
} from "@/app/lesson/[slug]/practice-result";
import { PYTHON_LAB_FIXTURES } from "@/lib/practice-session/python-lab-fixtures";
import type { PracticeRunnerResult } from "@/lib/practice-session/runner";

const PythonPracticeRunner = dynamic(
  () => import("@/app/lesson/[slug]/practice-python-runner"),
  { ssr: false },
);

type FixtureMode = "valid" | "infinite-loop";

export default function PythonLabsPreviewClient() {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<FixtureMode>("valid");
  const [result, setResult] = useState<PracticeRunnerResult | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const fixture = PYTHON_LAB_FIXTURES[index];
  const initialUserFiles = mode === "valid"
    ? fixture.validUserFiles
    : fixture.infiniteLoopUserFiles;

  const handleResult = useCallback((next: PracticeRunnerResult | null) => {
    setResult(next);
    setReviewed(false);
  }, []);
  const handleFilesChange = useCallback(() => setReviewed(false), []);

  function switchFixture(nextIndex: number) {
    setIndex(nextIndex);
    setMode("valid");
    setResult(null);
    setReviewed(false);
  }

  function switchMode(nextMode: FixtureMode) {
    setMode(nextMode);
    setResult(null);
    setReviewed(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs text-[#17242D]/45">
        /dev/python-labs-preview · 固定解答與測試，不呼叫 API／DB／LLM
      </p>
      <h1 className="mt-1 text-2xl font-bold">Python Interview Labs 驗收</h1>
      <p className="mt-2 text-sm text-[#17242D]/60">
        Infinite loop 應在 5 秒後終止；切回正常解答會建立新的 worker 並再次通過。
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {PYTHON_LAB_FIXTURES.map((item, itemIndex) => (
          <button
            type="button"
            key={item.lessonId}
            onClick={() => switchFixture(itemIndex)}
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

      <div className="mt-2 flex gap-2">
        {(["valid", "infinite-loop"] as const).map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => switchMode(value)}
            className={`rounded-xl border px-4 py-2 text-xs font-bold ${
              value === mode
                ? value === "valid"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-red-600 bg-red-50 text-red-800"
                : "border-[#17242D]/20 bg-white text-[#17242D]/55"
            }`}
          >
            {value === "valid" ? "正常解答" : "Infinite loop"}
          </button>
        ))}
      </div>

      <h2 className="mt-5 text-lg font-semibold">{fixture.title}</h2>
      <p className="mb-4 text-sm text-[#17242D]/60">
        {fixture.workspace.description}
      </p>
      <PythonPracticeRunner
        key={`${fixture.lessonId}:${mode}`}
        runtime="python"
        workspace={fixture.workspace}
        initialUserFiles={initialUserFiles}
        onFilesChange={handleFilesChange}
        onResult={handleResult}
      />
      <PracticeResultPanel result={result} />
      <PracticeEditorControls
        result={result}
        reviewing={false}
        passed={reviewed}
        onSubmit={() => setReviewed(true)}
      />
    </main>
  );
}
