"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PracticeRunnerProps } from "@/lib/practice-session/runner";
import { PyodidePracticeRunner } from "@/lib/practice-session/python-runner";
import {
  mergeUserFiles,
  type PracticeUserFiles,
} from "@/lib/practice-session/workspace";

export default function PythonPracticeRunner({
  workspace,
  initialUserFiles,
  onFilesChange,
  onResult,
}: PracticeRunnerProps) {
  const hydratedWorkspace = useMemo(
    () => mergeUserFiles(workspace, initialUserFiles),
    [initialUserFiles, workspace],
  );
  const [files, setFiles] = useState(() =>
    Object.fromEntries(
      hydratedWorkspace.files.map((file) => [file.path, file.code]),
    ),
  );
  const [activePath, setActivePath] = useState(workspace.entryFile);
  const [running, setRunning] = useState(false);
  const runnerRef = useRef<PyodidePracticeRunner | null>(null);

  useEffect(() => {
    onResult(null);
    return () => runnerRef.current?.dispose();
  }, [onResult]);

  const activeFile = workspace.files.find((file) => file.path === activePath);

  function updateFile(code: string) {
    if (!activeFile || activeFile.readOnly) return;
    const next = { ...files, [activePath]: code };
    const editableFiles: PracticeUserFiles = Object.fromEntries(
      workspace.files
        .filter((file) => !file.readOnly)
        .map((file) => [file.path, next[file.path] ?? ""]),
    );
    setFiles(next);
    onFilesChange(editableFiles);
    onResult(null);
  }

  async function runTests() {
    setRunning(true);
    const runner = runnerRef.current ?? new PyodidePracticeRunner();
    runnerRef.current = runner;
    const result = await runner.run({
      ...workspace,
      files: workspace.files.map((file) => ({
        ...file,
        code: files[file.path] ?? file.code,
      })),
    });
    onResult(result);
    setRunning(false);
  }

  return (
    <section className="overflow-hidden rounded-xl bg-[#17242D] text-white">
      <div className="flex overflow-x-auto border-b border-white/15">
        {workspace.files.map((file) => (
          <button
            type="button"
            key={file.path}
            onClick={() => setActivePath(file.path)}
            className={`shrink-0 px-4 py-2 font-mono text-xs ${
              activePath === file.path
                ? "bg-white/15 text-white"
                : "text-white/55 hover:text-white"
            }`}
          >
            {file.path.slice(1)}{file.readOnly ? " · 唯讀" : ""}
          </button>
        ))}
      </div>
      <textarea
        aria-label={activeFile ? `編輯 ${activeFile.path}` : "Python 編輯器"}
        value={files[activePath] ?? ""}
        onChange={(event) => updateFile(event.target.value)}
        readOnly={activeFile?.readOnly ?? true}
        spellCheck={false}
        className="min-h-[360px] w-full resize-y bg-[#0f171d] p-4 font-mono text-sm leading-6 text-white outline-none read-only:text-white/65"
      />
      <div className="border-t border-white/15 p-3">
        <button
          type="button"
          onClick={runTests}
          disabled={running}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#17242D] disabled:opacity-50"
        >
          {running ? "Python 初始化／測試執行中⋯" : "執行 Python 測試"}
        </button>
      </div>
    </section>
  );
}
