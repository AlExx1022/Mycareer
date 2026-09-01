import type { PracticeRuntime } from "@/db/curriculum/types";

export const LEGACY_REACT_ENTRY_FILE = "/exercise.tsx";
export const LEGACY_REACT_TEST_FILE = "/exercise.test.tsx";
export const LEGACY_REACT_SETUP_FILE = "/setup.ts";

export type PracticeFileRole = "starter" | "test" | "setup";

export type PracticeWorkspaceFile = {
  path: string;
  code: string;
  role: PracticeFileRole;
  readOnly: boolean;
};

export type PracticeWorkspace = {
  version: 2;
  description: string;
  entryFile: string;
  files: PracticeWorkspaceFile[];
};

export type LegacyPracticeExercise = {
  description: string;
  starterCode: string;
  testCode: string;
};

export type StoredPracticeExercise = LegacyPracticeExercise | PracticeWorkspace;
export type PracticeUserFiles = Record<string, string>;

const JEST_DOM_SETUP = "import '@testing-library/jest-dom';\n";

export function isPracticeWorkspace(
  exercise: StoredPracticeExercise,
): exercise is PracticeWorkspace {
  return "version" in exercise && exercise.version === 2;
}

export function isSafeWorkspacePath(path: string): boolean {
  return (
    path.startsWith("/") &&
    path.length > 1 &&
    !path.includes("\\") &&
    !path.split("/").includes("..")
  );
}

export function validatePracticeWorkspace(
  workspace: PracticeWorkspace,
  runtime?: PracticeRuntime,
): string[] {
  const errors: string[] = [];
  const paths = new Set<string>();

  if (!workspace.description.trim()) errors.push("description 不可為空");
  if (!isSafeWorkspacePath(workspace.entryFile)) {
    errors.push(`entryFile 路徑不合法：${workspace.entryFile}`);
  }

  for (const file of workspace.files) {
    if (!isSafeWorkspacePath(file.path)) {
      errors.push(`workspace 路徑不合法：${file.path}`);
    }
    if (paths.has(file.path)) errors.push(`workspace 路徑重複：${file.path}`);
    paths.add(file.path);
    if (file.role === "starter" && file.readOnly) {
      errors.push(`${file.path} 的 starter 檔必須可編輯`);
    }
    if (file.role !== "starter" && !file.readOnly) {
      errors.push(`${file.path} 的 ${file.role} 檔必須唯讀`);
    }
  }

  const entry = workspace.files.find((file) => file.path === workspace.entryFile);
  if (!entry) errors.push(`entryFile 不存在：${workspace.entryFile}`);
  if (entry?.readOnly) errors.push("entryFile 必須可編輯");
  if (!workspace.files.some((file) => file.role === "test")) {
    errors.push("workspace 至少需要一個 test 檔");
  }

  const expectedExtension = runtime === "python"
    ? ".py"
    : runtime === "vanilla-js"
      ? ".js"
      : runtime === "vanilla-ts"
        ? ".ts"
        : runtime === "react-ts"
          ? ".tsx"
          : null;
  if (expectedExtension && !workspace.entryFile.endsWith(expectedExtension)) {
    errors.push(`${runtime} entryFile 必須使用 ${expectedExtension}`);
  }

  return errors;
}

/** 將舊 React 三件套無損映射為 v2；舊 userCode 只覆蓋 entry file。 */
export function normalizePracticeWorkspace(
  exercise: StoredPracticeExercise,
  options: {
    userCode?: string | null;
    userFiles?: PracticeUserFiles | null;
  } = {},
): { workspace: PracticeWorkspace; userFiles: PracticeUserFiles } {
  const workspace: PracticeWorkspace = isPracticeWorkspace(exercise)
    ? {
        ...exercise,
        files: exercise.files.map((file) => ({ ...file })),
      }
    : {
        version: 2,
        description: exercise.description,
        entryFile: LEGACY_REACT_ENTRY_FILE,
        files: [
          {
            path: LEGACY_REACT_ENTRY_FILE,
            code: exercise.starterCode,
            role: "starter",
            readOnly: false,
          },
          {
            path: LEGACY_REACT_TEST_FILE,
            code: exercise.testCode,
            role: "test",
            readOnly: true,
          },
          {
            path: LEGACY_REACT_SETUP_FILE,
            code: JEST_DOM_SETUP,
            role: "setup",
            readOnly: true,
          },
        ],
      };

  const userFiles = Object.fromEntries(
    workspace.files
      .filter((file) => !file.readOnly)
      .map((file) => {
        const saved = options.userFiles?.[file.path];
        const legacyEntry =
          file.path === workspace.entryFile ? options.userCode : undefined;
        return [
          file.path,
          typeof saved === "string"
            ? saved
            : typeof legacyEntry === "string"
              ? legacyEntry
              : file.code,
        ];
      }),
  );

  return { workspace, userFiles };
}

export function mergeUserFiles(
  workspace: PracticeWorkspace,
  userFiles: PracticeUserFiles,
): PracticeWorkspace {
  return {
    ...workspace,
    files: workspace.files.map((file) => ({
      ...file,
      code: !file.readOnly && typeof userFiles[file.path] === "string"
        ? userFiles[file.path]
        : file.code,
    })),
  };
}

export function sanitizeEditableUserFiles(
  workspace: PracticeWorkspace,
  input: unknown,
): PracticeUserFiles | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const candidate = input as Record<string, unknown>;
  const editablePaths = workspace.files
    .filter((file) => !file.readOnly)
    .map((file) => file.path);
  const candidatePaths = Object.keys(candidate);
  if (
    candidatePaths.length !== editablePaths.length ||
    candidatePaths.some((path) => !editablePaths.includes(path))
  ) {
    return null;
  }

  const files: PracticeUserFiles = {};
  let totalLength = 0;
  for (const path of editablePaths) {
    const code = candidate[path];
    if (typeof code !== "string") return null;
    totalLength += code.length;
    if (totalLength > 100_000) return null;
    files[path] = code;
  }
  return files;
}

export function getEntryCode(
  workspace: PracticeWorkspace,
  userFiles: PracticeUserFiles,
): string {
  return userFiles[workspace.entryFile] ?? "";
}
