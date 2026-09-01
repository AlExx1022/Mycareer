"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackProvider,
  SandpackTests,
  useSandpack,
} from "@codesandbox/sandpack-react";
import {
  normalizeSandpackResult,
  type PracticeRunnerProps,
  type SandpackDescribeNode,
} from "@/lib/practice-session/runner";
import {
  createSandpackAdapter,
  type SandpackRuntime,
} from "@/lib/practice-session/sandpack-adapters";
import { mergeUserFiles } from "@/lib/practice-session/workspace";

function SandpackFileObserver({
  editablePaths,
  onFilesChange,
  onResult,
}: {
  editablePaths: string[];
  onFilesChange: PracticeRunnerProps["onFilesChange"];
  onResult: PracticeRunnerProps["onResult"];
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
    onResult(null);
  }, [editablePaths, onFilesChange, onResult, sandpack.files]);

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
              onResult(
                normalizeSandpackResult(
                  specs as Record<string, SandpackDescribeNode>,
                ),
              )
            }
          />
        </SandpackLayout>
      </div>
      <SandpackFileObserver
        editablePaths={editablePaths}
        onFilesChange={onFilesChange}
        onResult={onResult}
      />
    </SandpackProvider>
  );
}
