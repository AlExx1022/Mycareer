"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackProvider,
  SandpackTests,
  useSandpack,
} from "@codesandbox/sandpack-react";
import {
  normalizeSandpackResult,
  type PracticeDiagnostic,
  type PracticeRunnerResult,
  type PracticeRunnerProps,
  type SandpackDescribeNode,
} from "@/lib/practice-session/runner";
import {
  createSandpackAdapter,
  type SandpackRuntime,
} from "@/lib/practice-session/sandpack-adapters";
import { mergeUserFiles } from "@/lib/practice-session/workspace";
import { TypeScriptCheckClient } from "@/lib/practice-session/typescript-check-client";

function SandpackFileObserver({
  editablePaths,
  onFilesChange,
}: {
  editablePaths: string[];
  onFilesChange: PracticeRunnerProps["onFilesChange"];
}) {
  const { sandpack } = useSandpack();
  const previousFilesRef = useRef<string | null>(null);

  useEffect(() => {
    const files = Object.fromEntries(
      editablePaths.map((path) => [path, sandpack.files[path]?.code ?? ""]),
    );
    const signature = JSON.stringify(files);
    if (signature === previousFilesRef.current) return;
    previousFilesRef.current = signature;
    onFilesChange(files);
  }, [editablePaths, onFilesChange, sandpack.files]);

  return null;
}

export default function SandpackPracticeRunner({
  runtime,
  workspace,
  initialUserFiles,
  onFilesChange,
  onResult,
}: PracticeRunnerProps) {
  if (runtime === "python") {
    throw new Error("SandpackPracticeRunner 不支援 python runtime");
  }

  const hydratedWorkspace = useMemo(
    () => mergeUserFiles(workspace, initialUserFiles),
    [initialUserFiles, workspace],
  );
  const adapter = useMemo(
    () => createSandpackAdapter(runtime as SandpackRuntime, hydratedWorkspace),
    [hydratedWorkspace, runtime],
  );
  const editablePaths = useMemo(
    () => workspace.files.filter((file) => !file.readOnly).map((file) => file.path),
    [workspace],
  );
  const typeScriptRuntime = runtime === "react-ts" || runtime === "vanilla-ts";
  const [editableFiles, setEditableFiles] = useState<Record<string, string> | null>(
    null,
  );
  const [testResult, setTestResult] = useState<PracticeRunnerResult | null>(null);
  const [compileDiagnostics, setCompileDiagnostics] = useState<
    PracticeDiagnostic[] | null
  >(typeScriptRuntime ? null : []);
  const checkerRef = useRef<TypeScriptCheckClient | null>(null);
  const testResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFilesChange = useCallback(
    (files: Record<string, string>) => {
      onFilesChange(files);
      setEditableFiles(files);
      setTestResult(null);
      setCompileDiagnostics(typeScriptRuntime ? null : []);
      onResult(null);
    },
    [onFilesChange, onResult, typeScriptRuntime],
  );

  useEffect(() => {
    if (!typeScriptRuntime || !editableFiles) return;
    checkerRef.current ??= new TypeScriptCheckClient();
    let active = true;
    const timer = setTimeout(() => {
      checkerRef.current
        ?.check(editableFiles, runtime === "react-ts")
        .then((diagnostics) => {
          if (active) setCompileDiagnostics(diagnostics);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [editableFiles, runtime, typeScriptRuntime]);

  useEffect(
    () => () => {
      if (testResultTimerRef.current) {
        clearTimeout(testResultTimerRef.current);
      }
      checkerRef.current?.terminate();
      checkerRef.current = null;
    },
    [],
  );

  const handleTestsComplete = useCallback(
    (specs: Record<string, SandpackDescribeNode>) => {
      const result = normalizeSandpackResult(specs);
      if (testResultTimerRef.current) {
        clearTimeout(testResultTimerRef.current);
      }
      testResultTimerRef.current = setTimeout(() => {
        setTestResult(result);
        testResultTimerRef.current = null;
      }, 0);
    },
    [],
  );

  useEffect(() => {
    if (!testResult || compileDiagnostics === null) return;
    const diagnostics = [
      ...compileDiagnostics,
      ...testResult.diagnostics,
    ];
    onResult({
      ...testResult,
      diagnostics,
      passed: testResult.passed && diagnostics.length === 0,
    });
  }, [compileDiagnostics, onResult, testResult]);

  useEffect(() => onResult(null), [onResult]);

  return (
    <SandpackProvider
      template={adapter.template}
      theme="dark"
      files={adapter.files}
      customSetup={adapter.customSetup}
      options={{
        visibleFiles: adapter.visibleFiles,
        activeFile: adapter.activeFile,
      }}
    >
      <div className="practice-sandbox">
        <SandpackLayout style={{ flexDirection: "column" }}>
          <SandpackCodeEditor showLineNumbers />
          <SandpackTests
            watchMode
            onComplete={(specs) =>
              handleTestsComplete(
                specs as Record<string, SandpackDescribeNode>,
              )
            }
          />
        </SandpackLayout>
      </div>
      <SandpackFileObserver
        editablePaths={editablePaths}
        onFilesChange={handleFilesChange}
      />
    </SandpackProvider>
  );
}
