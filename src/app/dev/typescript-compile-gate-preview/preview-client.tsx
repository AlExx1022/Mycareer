"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import {
  PracticeEditorControls,
  PracticeResultPanel,
} from "@/app/lesson/[slug]/practice-result";
import type { PracticeRunnerResult } from "@/lib/practice-session/runner";
import { TYPESCRIPT_LAB_FIXTURES } from "@/lib/practice-session/typescript-lab-fixtures";

const SandpackPracticeRunner = dynamic(
  () => import("@/app/lesson/[slug]/practice-sandpack-runner"),
  { ssr: false },
);

type FixtureMode = "valid" | "type-error";

export default function TypeScriptCompileGatePreviewClient() {
  const [lessonId, setLessonId] = useState(
    TYPESCRIPT_LAB_FIXTURES[0].lessonId,
  );
  const [mode, setMode] = useState<FixtureMode>("valid");
  const [result, setResult] = useState<PracticeRunnerResult | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const fixture = TYPESCRIPT_LAB_FIXTURES.find(
    (candidate) => candidate.lessonId === lessonId,
  ) ?? TYPESCRIPT_LAB_FIXTURES[0];
  const initialUserFiles = mode === "valid"
    ? fixture.validUserFiles
    : fixture.runtimePassTypeFailureFiles;

  const handleFilesChange = useCallback(() => {
    setReviewed(false);
  }, []);
  const handleResult = useCallback((next: PracticeRunnerResult | null) => {
    setResult(next);
    setReviewed(false);
  }, []);

  function switchFixture(nextLessonId: string) {
    setLessonId(nextLessonId);
    setResult(null);
    setReviewed(false);
  }

  function switchMode(nextMode: FixtureMode) {
    setMode(nextMode);
    setResult(null);
    setReviewed(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="font-mono text-xs text-[#17242D]/45">
        /dev/typescript-compile-gate-preview · 不呼叫 API／DB／LLM
      </p>
      <h1 className="mt-1 text-2xl font-bold">TypeScript Compile Gate 驗收</h1>
      <p className="mt-2 text-sm text-[#17242D]/60">
        三題各有正常解答與「runtime 邏輯不變、strict typecheck 失敗」版本；後者不得啟用 AI review。
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {TYPESCRIPT_LAB_FIXTURES.map((candidate) => (
          <button
            key={candidate.lessonId}
            type="button"
            onClick={() => switchFixture(candidate.lessonId)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              candidate.lessonId === fixture.lessonId
                ? "border-[#17242D] bg-[#17242D] text-white"
                : "border-[#17242D]/20 text-[#17242D]/60"
            }`}
          >
            {candidate.title}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        {(["valid", "type-error"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => switchMode(value)}
            className={`rounded-xl border px-4 py-2 text-xs font-bold ${
              mode === value
                ? value === "valid"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-red-600 bg-red-50 text-red-800"
                : "border-[#17242D]/20 bg-white text-[#17242D]/55"
            }`}
          >
            {value === "valid" ? "正常解答" : "Runtime 過／型別錯"}
          </button>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="mb-1 text-lg font-semibold">{fixture.title}</h2>
        <p className="mb-4 text-sm text-[#17242D]/65">
          {fixture.workspace.description}
        </p>
        <SandpackPracticeRunner
          key={`${fixture.lessonId}:${mode}`}
          runtime={fixture.runtime}
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
        {reviewed ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Compile diagnostics 為空且 runtime tests 全過，AI review gate 已開啟。
          </p>
        ) : null}
      </section>
    </main>
  );
}
