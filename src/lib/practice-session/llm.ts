import { generateObject } from "ai";
import { z } from "zod";
import type { LessonContext } from "@/db/queries/lesson-context";
import type {
  PracticeBlueprint,
  PracticeRuntime,
} from "@/db/curriculum/types";
import { MODEL } from "@/lib/lesson-session/graph";
import {
  validatePracticeWorkspace,
  type PracticeUserFiles,
  type PracticeWorkspace,
} from "./workspace";

type CompletePracticeContext = LessonContext & {
  lessonType: "practice";
  practiceRuntime: PracticeRuntime;
  practiceBlueprint: PracticeBlueprint;
};

const workspaceFileSchema = z.object({
  path: z
    .string()
    .describe("以 / 開頭的 workspace 絕對路徑，不得包含 .."),
  code: z.string().describe("完整檔案內容，使用真正換行，不使用字面 \\n"),
  role: z.enum(["starter", "test", "setup"]),
  readOnly: z.boolean(),
});

export const exerciseSchema = z.object({
  version: z.literal(2),
  description: z
    .string()
    .describe("題目說明，繁體中文，含情境、需求、邊界條件與輸入輸出範例"),
  entryFile: z.string().describe("主要可編輯檔案的絕對路徑"),
  files: z
    .array(workspaceFileSchema)
    .min(2)
    .describe("至少包含一個可編輯 starter 與一個唯讀 test"),
});

export const reviewSchema = z.object({
  verdict: z
    .enum(["pass", "fail"])
    .describe("程式碼是否真正滿足題目與測試意圖"),
  comments: z
    .array(z.string())
    .describe("給學生的 review 意見，繁體中文，每則一個重點"),
  weaknesses: z
    .array(
      z.object({
        criterion: z.string().describe("對應的 rubric criterion 原文"),
        summary: z.string().describe("一句話描述弱點本質"),
      }),
    )
    .describe("review 發現的弱點，沒有則空陣列"),
});

export type ReviewResult = z.infer<typeof reviewSchema>;

// 生成偶爾會把換行寫成字面上的 \n（兩個字元）而非真正換行，
// 程式碼擠成一行丟進 runner 會直接解析失敗；長字串裡沒有半個真換行卻有字面 \n 就判定壞掉。
export function looksCorrupted(text: string): boolean {
  return text.length > 60 && !text.includes("\n") && text.includes("\\n");
}

function isExerciseCorrupted(exercise: PracticeWorkspace): boolean {
  return (
    looksCorrupted(exercise.description) ||
    exercise.files.some((file) => looksCorrupted(file.code))
  );
}

export function countGeneratedTests(
  exercise: PracticeWorkspace,
  runtime: PracticeRuntime,
): number {
  const testCode = exercise.files
    .filter(({ role }) => role === "test")
    .map(({ code }) => code)
    .join("\n");
  return runtime === "python"
    ? [...testCode.matchAll(/^\s*def\s+test_[A-Za-z0-9_]+\s*\(/gm)].length
    : [...testCode.matchAll(/\b(?:it|test)\s*\(/g)].length;
}

const PYTHON_STDLIB_IMPORTS = new Set([
  "__future__",
  "abc",
  "argparse",
  "ast",
  "collections",
  "contextlib",
  "csv",
  "dataclasses",
  "datetime",
  "decimal",
  "enum",
  "functools",
  "hashlib",
  "io",
  "itertools",
  "json",
  "math",
  "operator",
  "pathlib",
  "re",
  "statistics",
  "string",
  "textwrap",
  "time",
  "typing",
  "types",
  "unittest",
]);

const PYTHON_BLOCKED_CAPABILITIES = [
  { pattern: /\b(?:from|import)\s+socket\b/m, label: "socket" },
  { pattern: /\b(?:from|import)\s+subprocess\b/m, label: "subprocess" },
  { pattern: /\b(?:from|import)\s+(?:urllib\.request|http\.client)\b/m, label: "外部 network" },
  { pattern: /\b(?:micropip|pyodide\.http)\b/m, label: "runtime package/network loader" },
] as const;
const PYTHON_BLOCKED_IMPORT_ROOTS = new Set([
  "http",
  "micropip",
  "pyodide",
  "socket",
  "subprocess",
  "urllib",
]);

export function pythonRuntimeValidationErrors(
  exercise: PracticeWorkspace,
): string[] {
  const errors: string[] = [];
  const pythonCode = exercise.files
    .filter(({ path }) => path.endsWith(".py"))
    .map(({ code }) => code)
    .join("\n");
  const localModules = new Set(
    exercise.files
      .filter(({ path }) => path.endsWith(".py"))
      .flatMap(({ path }) => {
        const segments = path.slice(1, -3).split("/");
        return [segments[0], segments.at(-1)].filter(
          (value): value is string => Boolean(value && value !== "__init__"),
        );
      }),
  );

  for (const blocked of PYTHON_BLOCKED_CAPABILITIES) {
    if (blocked.pattern.test(pythonCode)) {
      errors.push(`Python browser runtime 不支援 ${blocked.label}`);
    }
  }

  const importedRoots = new Set<string>();
  for (const line of pythonCode.split("\n")) {
    const fromImport = line.match(/^\s*from\s+([A-Za-z_][\w.]*)\s+import\b/);
    if (fromImport) importedRoots.add(fromImport[1].split(".")[0]);

    const directImport = line.match(/^\s*import\s+(.+?)\s*(?:#.*)?$/);
    for (const item of directImport?.[1].split(",") ?? []) {
      const moduleName = item.trim().split(/\s+as\s+/, 1)[0];
      const root = moduleName.split(".")[0];
      if (root) importedRoots.add(root);
    }
  }

  for (const root of importedRoots) {
    if (
      !PYTHON_BLOCKED_IMPORT_ROOTS.has(root) &&
      !PYTHON_STDLIB_IMPORTS.has(root) &&
      !localModules.has(root)
    ) {
      errors.push(`Python browser runtime 僅允許標準函式庫或 workspace module：${root}`);
    }
  }

  return [...new Set(errors)];
}

function generationValidationErrors(
  exercise: PracticeWorkspace,
  runtime: PracticeRuntime,
): string[] {
  const errors = validatePracticeWorkspace(exercise, runtime);
  const testCount = countGeneratedTests(exercise, runtime);
  if (testCount < 4 || testCount > 6) {
    errors.push(`生成測試必須為 4–6 條，目前為 ${testCount} 條`);
  }
  if (runtime === "python") {
    errors.push(...pythonRuntimeValidationErrors(exercise));
  }
  return errors;
}

function requirePracticeContext(
  lesson: LessonContext,
): CompletePracticeContext {
  if (
    lesson.lessonType !== "practice" ||
    !lesson.practiceRuntime ||
    !lesson.practiceBlueprint
  ) {
    throw new Error(
      `實作節點 ${lesson.lessonId} 缺少 practiceRuntime 或 practiceBlueprint`,
    );
  }
  return lesson as CompletePracticeContext;
}

function runtimeInstructions(runtime: PracticeRuntime): string {
  switch (runtime) {
    case "react-ts":
      return `- entry file 使用 .tsx；其他 TypeScript 模組可使用 .ts。
- 測試使用 Jest 全域 describe / it / expect 與 Testing Library；不要 import 測試框架。
- UI matcher 由 setup file import @testing-library/jest-dom。`;
    case "vanilla-ts":
      return `- entry file 與模組使用 .ts，不產生 React、DOM 或 JSX。
- 測試檔使用 .test.ts，以相對路徑 import starter export，並使用 Jest 全域 describe / it / expect。`;
    case "vanilla-js":
      return `- entry file 與模組使用 .js，不產生 TypeScript 型別、React 或 JSX。
- 使用 ESM export/import；測試檔使用 .test.js 與 Jest 全域 describe / it / expect。`;
    case "python":
      return `- 所有檔案使用 .py；entry file 匯出題目要求的函式或 class。
- 測試只使用 Python 標準庫與原生 assert，不 import pytest。
- 每條測試寫成名稱以 test_ 開頭、無參數的函式；不得使用網路、檔案系統外部資源或無限迴圈。`;
  }
}

function reviewInstructions(runtime: PracticeRuntime): string {
  if (runtime !== "python") {
    return `- 依 ${runtime} runtime 的語言與 framework 慣例 review。`;
  }
  return `- 只依 Python 語意與慣例 review：name binding、iterator/generator、exception boundary、type hints 的 runtime 限制與資料結構 Big-O。
- 不提供 React、TypeScript 或前端 framework 建議；不要把 type annotation 當 runtime validation。
- 若解答使用 socket、subprocess、外部 network、第三方或 native-only package，必須判 fail。`;
}

function blueprintPrompt(blueprint: PracticeBlueprint): string {
  return `核心目標：${blueprint.objective}

必要需求：
${blueprint.requirements.map((item) => `- ${item}`).join("\n")}

邊界條件：
${blueprint.edgeCases.map((item) => `- ${item}`).join("\n")}

建議時限：${blueprint.timeboxMinutes} 分鐘
${blueprint.starterSignature ? `指定起始簽名：${blueprint.starterSignature}\n` : ""}
延伸追問（不納入基本題目）：
${blueprint.followUps.map((item) => `- ${item}`).join("\n")}`;
}

export async function generateExercise(
  lessonContext: LessonContext,
): Promise<PracticeWorkspace> {
  const lesson = requirePracticeContext(lessonContext);
  let exercise = await generate(lesson);
  let validationErrors = generationValidationErrors(
    exercise,
    lesson.practiceRuntime,
  );
  if (isExerciseCorrupted(exercise) || validationErrors.length > 0) {
    exercise = await generate(lesson);
    validationErrors = generationValidationErrors(
      exercise,
      lesson.practiceRuntime,
    );
  }
  if (isExerciseCorrupted(exercise)) {
    throw new Error("實作題出題失敗：程式碼格式異常");
  }

  if (validationErrors.length > 0) {
    throw new Error(`實作題 workspace 格式錯誤：${validationErrors.join("；")}`);
  }
  return exercise;
}

async function generate(
  lesson: CompletePracticeContext,
): Promise<PracticeWorkspace> {
  const { object } = await generateObject({
    model: MODEL,
    schema: exerciseSchema,
    maxRetries: 1,
    prompt: `為「${lesson.pathTitle}」的 ${lesson.subject} 實作節點「${lesson.title}」出一道面試練習。

程式語言：${lesson.codeLanguage}
Runtime：${lesson.practiceRuntime}

人工策展 blueprint（不得改變核心目標、必要需求或邊界條件）：
${blueprintPrompt(lesson.practiceBlueprint)}

考點範圍：
${lesson.examPoints.map((point) => `- ${point}`).join("\n")}

驗收標準：
${lesson.rubric.map((item) => `- ${item.criterion}：${item.passCondition}`).join("\n")}

Runtime 規則：
${runtimeInstructions(lesson.practiceRuntime)}

Workspace 規則：
- 回傳 version: 2。entryFile 必須指向存在、role 為 starter、readOnly 為 false 的檔案。
- 可拆成多個 starter 檔；test 與 setup 一律 readOnly: true。所有 path 以 / 開頭且不可含 ..。
- 測試 4-6 條，逐條對應必要需求，並覆蓋所有 blueprint edgeCases；測試名稱描述可觀察行為。
- 題目情境可以變化，但不得增加 blueprint 之外的大型功能；學生應能在 ${lesson.practiceBlueprint.timeboxMinutes} 分鐘內完成。
- description 使用繁體中文，明列需求與邊界，不洩漏解答；檔案內容必須使用真正換行。`,
  });
  return object;
}

function renderWorkspaceForReview(
  workspace: PracticeWorkspace,
  userFiles: PracticeUserFiles,
  codeLanguage: string,
): string {
  return workspace.files
    .map((file) => {
      const code = file.readOnly ? file.code : (userFiles[file.path] ?? file.code);
      return `### ${file.path} (${file.role}${file.readOnly ? ", read-only" : ""})\n\`\`\`${codeLanguage}\n${code}\n\`\`\``;
    })
    .join("\n\n");
}

export async function reviewCode(
  lessonContext: LessonContext,
  workspace: PracticeWorkspace,
  userFiles: PracticeUserFiles,
): Promise<ReviewResult> {
  const lesson = requirePracticeContext(lessonContext);
  const { object } = await generateObject({
    model: MODEL,
    schema: reviewSchema,
    maxRetries: 1,
    prompt: `你是資深 ${lesson.subject} 工程師，正在 review「${lesson.pathTitle}」學生的實作題解答。

題目：
${workspace.description}

人工策展 blueprint：
${blueprintPrompt(lesson.practiceBlueprint)}

Workspace（starter 檔已替換成學生目前內容）：
${renderWorkspaceForReview(workspace, userFiles, lesson.codeLanguage)}

驗收標準：
${lesson.rubric.map((item) => `- ${item.criterion}：${item.passCondition}`).join("\n")}

Runtime review 規則：
${reviewInstructions(lesson.practiceRuntime)}

任務：
1. 依 ${lesson.codeLanguage} 慣例與 blueprint 判定 verdict。空殼、硬編測資、偏離 objective、漏 requirement/edge case 一律 fail。
2. comments 給 2-4 則具體意見，涵蓋正確性、命名、慣用寫法、邊界情況或可讀性；繁體中文、對事不對人。
3. weaknesses 僅記錄對應 rubric 的觀念誤解；單純風格瑕疵不算。沒有弱點則回傳空陣列。`,
  });
  return object;
}
