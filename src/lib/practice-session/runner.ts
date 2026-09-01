import type { PracticeRuntime } from "@/db/curriculum/types";
import type {
  PracticeUserFiles,
  PracticeWorkspace,
} from "./workspace";

export type PracticeTestResult = {
  name: string;
  status: "pass" | "fail";
  message?: string;
};

export type PracticeDiagnostic = {
  file: string;
  line?: number;
  message: string;
};

export type PracticeRunnerResult = {
  passed: boolean;
  tests: PracticeTestResult[];
  diagnostics: PracticeDiagnostic[];
  runtimeError?: string;
};

export type PracticeRunnerProps = {
  runtime: PracticeRuntime;
  workspace: PracticeWorkspace;
  initialUserFiles: PracticeUserFiles;
  onFilesChange: (files: PracticeUserFiles) => void;
  onResult: (result: PracticeRunnerResult | null) => void;
};

export type SandpackTestNode = {
  status?: string;
  name?: string;
  error?: unknown;
};

export type SandpackDescribeNode = {
  tests?: Record<string, SandpackTestNode>;
  describes?: Record<string, SandpackDescribeNode>;
  error?: unknown;
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "編譯或測試執行失敗";
}

function errorLine(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const record = error as Record<string, unknown>;
  for (const key of ["line", "lineNumber"] as const) {
    if (typeof record[key] === "number") return record[key];
  }
  return undefined;
}

function collectSandpackResult(
  name: string,
  node: SandpackDescribeNode,
  tests: PracticeTestResult[],
  diagnostics: PracticeDiagnostic[],
) {
  if (node.error) {
    diagnostics.push({
      file: name,
      line: errorLine(node.error),
      message: errorMessage(node.error),
    });
  }

  for (const [testId, test] of Object.entries(node.tests ?? {})) {
    const status = test.status === "pass" ? "pass" : "fail";
    tests.push({
      name: test.name || testId,
      status,
      ...(test.error ? { message: errorMessage(test.error) } : {}),
    });
  }

  for (const [describeId, child] of Object.entries(node.describes ?? {})) {
    collectSandpackResult(describeId, child, tests, diagnostics);
  }
}

export function normalizeSandpackResult(
  specs: Record<string, SandpackDescribeNode>,
): PracticeRunnerResult {
  const tests: PracticeTestResult[] = [];
  const diagnostics: PracticeDiagnostic[] = [];
  for (const [name, spec] of Object.entries(specs)) {
    collectSandpackResult(name, spec, tests, diagnostics);
  }

  return {
    passed:
      diagnostics.length === 0 &&
      tests.length > 0 &&
      tests.every((test) => test.status === "pass"),
    tests,
    diagnostics,
  };
}

export function allTestsPass(
  specs: Record<string, SandpackDescribeNode>,
): boolean {
  return normalizeSandpackResult(specs).passed;
}
