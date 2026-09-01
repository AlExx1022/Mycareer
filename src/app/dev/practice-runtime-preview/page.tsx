"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import type { PracticeRuntime } from "@/db/curriculum/types";
import { PRACTICE_RUNTIME_FIXTURES } from "@/lib/practice-session/fixtures";
import type { PracticeRunnerResult } from "@/lib/practice-session/runner";
import {
  PracticeEditorControls,
  PracticeResultPanel,
} from "@/app/lesson/[slug]/practice-result";

const SandpackPracticeRunner = dynamic(
  () => import("@/app/lesson/[slug]/practice-sandpack-runner"),
  { ssr: false },
);
const PythonPracticeRunner = dynamic(
  () => import("@/app/lesson/[slug]/practice-python-runner"),
  { ssr: false },
);

const RUNTIMES = ["react-ts", "vanilla-ts", "vanilla-js", "python"] as const;

export default function PracticeRuntimePreviewPage() {
  const [runtime, setRuntime] = useState<PracticeRuntime>("react-ts");
  const [result, setResult] = useState<PracticeRunnerResult | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedFileCount, setSavedFileCount] = useState(0);
  const [generation, setGeneration] = useState(0);
  const fixture = PRACTICE_RUNTIME_FIXTURES[runtime];
  const initialUserFiles = useMemo(
    () =>
      Object.fromEntries(
        fixture.workspace.files
          .filter((file) => !file.readOnly)
          .map((file) => [file.path, file.code]),
      ),
    [fixture],
  );
  const RuntimeRunner = runtime === "python"
    ? PythonPracticeRunner
    : SandpackPracticeRunner;

  const handleFilesChange = useCallback((files: Record<string, string>) => {
    setSavedAt(new Date().toLocaleTimeString("zh-TW"));
    setSavedFileCount(Object.keys(files).length);
    setReviewed(false);
  }, []);
  const handleResult = useCallback((nextResult: PracticeRunnerResult | null) => {
    setResult(nextResult);
    setReviewed(false);
  }, []);

  function switchRuntime(nextRuntime: PracticeRuntime) {
    setRuntime(nextRuntime);
    setResult(null);
    setReviewed(false);
    setSavedAt(null);
    setSavedFileCount(0);
    setGeneration(0);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="font-mono text-xs text-[#17242D]/45">
        /dev/practice-runtime-preview · 四種 runtime fixture，不呼叫 API／DB／LLM
      </p>
      <h1 className="mt-1 text-2xl font-bold">Practice runtime 驗收</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {RUNTIMES.map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => switchRuntime(value)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              runtime === value
                ? "border-[#17242D] bg-[#17242D] text-white"
                : "border-[#17242D]/20 text-[#17242D]/60"
            }`}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setReviewed(false);
            setSavedAt(null);
            setSavedFileCount(0);
            setGeneration((value) => value + 1);
          }}
          className="ml-auto rounded-full border border-[#17242D]/20 px-3 py-1 text-xs font-semibold text-[#17242D]/60"
        >
          重新載入 fixture（模擬重新出題）
        </button>
      </div>

      <section className="mt-6">
        <h2 className="mb-1 text-lg font-semibold">{fixture.title}</h2>
        <p className="mb-4 text-sm text-[#17242D]/65">
          {fixture.workspace.description}
        </p>
        <RuntimeRunner
          key={`${runtime}:${generation}`}
          runtime={runtime}
          workspace={fixture.workspace}
          initialUserFiles={initialUserFiles}
          onFilesChange={handleFilesChange}
          onResult={handleResult}
        />
        <p className="mt-2 text-xs text-[#17242D]/45">
          {savedAt ? `模擬 autosave：${savedAt}` : "修改任一可編輯檔案以驗證多檔 autosave"}
        </p>
        <PracticeResultPanel result={result} />
        <PracticeEditorControls
          result={result}
          reviewing={false}
          passed={reviewed}
          onSubmit={() => setReviewed(true)}
        />
        {reviewed && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            模擬 AI review 已收到 {savedFileCount} 個可編輯檔案。
          </p>
        )}
      </section>
    </main>
  );
}
