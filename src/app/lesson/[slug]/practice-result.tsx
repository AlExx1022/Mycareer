"use client";

import type { PracticeRunnerResult } from "@/lib/practice-session/runner";

export function PracticeResultPanel({
  result,
}: {
  result: PracticeRunnerResult | null;
}) {
  if (!result) {
    return (
      <p className="mt-3 text-xs text-[#17242D]/45">
        執行測試後會在這裡顯示逐條結果與診斷。
      </p>
    );
  }

  return (
    <section
      className="mt-3 rounded-lg border border-[#17242D]/15 px-4 py-3 text-sm"
      aria-live="polite"
    >
      <p className={`font-semibold ${result.passed ? "text-emerald-700" : "text-red-700"}`}>
        {result.passed ? "所有測試通過" : "尚未通過"}
      </p>

      {result.runtimeError && (
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-red-700">
          {result.runtimeError}
        </pre>
      )}

      {result.diagnostics.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-red-700">
          {result.diagnostics.map((diagnostic, index) => (
            <li key={`${diagnostic.file}:${diagnostic.line ?? 0}:${index}`}>
              {diagnostic.file}
              {diagnostic.line ? `:${diagnostic.line}` : ""}：{diagnostic.message}
            </li>
          ))}
        </ul>
      )}

      {result.tests.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {result.tests.map((test, index) => (
            <li
              key={`${test.name}:${index}`}
              className={test.status === "pass" ? "text-emerald-700" : "text-red-700"}
            >
              {test.status === "pass" ? "✓" : "✕"} {test.name}
              {test.message ? ` — ${test.message}` : ""}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PracticeEditorControls({
  result,
  reviewing,
  passed,
  onSubmit,
}: {
  result: PracticeRunnerResult | null;
  reviewing: boolean;
  passed: boolean;
  onSubmit: () => void;
}) {
  if (passed) return null;

  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={!result?.passed || reviewing}
      className="mt-3 w-full rounded-lg bg-[#17242D] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
    >
      {reviewing
        ? "AI review 中⋯"
        : result?.passed
          ? "測試全過，送出 AI review"
          : "先讓所有測試通過"}
    </button>
  );
}

