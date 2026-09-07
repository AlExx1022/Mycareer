import assert from "node:assert/strict";
import { getLessonContext } from "@/db/queries/lesson-context";
import { generateExercise } from "@/lib/practice-session/llm";
import { validatePracticeWorkspace } from "@/lib/practice-session/workspace";

const LABS = [
  {
    lessonId: "ts-unsafe-any-clinic",
    runtime: "vanilla-ts",
    requiredSignals: [/unknown/i, /invalid|缺|錯/i, /error|catch/i],
  },
  {
    lessonId: "ts-async-state-machine-lab",
    runtime: "vanilla-ts",
    requiredSignals: [/loading/i, /success/i, /error/i, /empty|retry|重試/i],
  },
  {
    lessonId: "ts-typed-data-page-capstone",
    runtime: "react-ts",
    requiredSignals: [/loading/i, /empty/i, /error/i, /invalid|驗證|錯/i],
  },
] as const;

function countTests(code: string) {
  return [...code.matchAll(/\b(?:it|test)\s*\(/g)].length;
}

async function main() {
  const summaries = [];

  for (const lab of LABS) {
    const context = await getLessonContext(lab.lessonId, {
      includeDraft: true,
    });
    assert.ok(context, `找不到 ${lab.lessonId}`);
    assert.equal(context.lessonType, "practice");
    assert.equal(context.practiceRuntime, lab.runtime);
    assert.ok(context.practiceBlueprint);

    const workspace = await generateExercise(context);
    assert.deepEqual(validatePracticeWorkspace(workspace, lab.runtime), []);
    const testFiles = workspace.files.filter(({ role }) => role === "test");
    const testCorpus = testFiles.map(({ code }) => code).join("\n");
    const testCount = countTests(testCorpus);
    assert.ok(
      testCount >= 4 && testCount <= 6,
      `${lab.lessonId} 生成測試必須為 4–6 條，目前 ${testCount} 條`,
    );
    assert.ok(
      workspace.files.some(
        ({ role, readOnly, path }) =>
          role === "starter" &&
          !readOnly &&
          (path.endsWith(".ts") || path.endsWith(".tsx")),
      ),
      `${lab.lessonId} 缺少可編輯 TypeScript starter`,
    );
    assert.ok(testFiles.every(({ readOnly }) => readOnly));
    for (const signal of lab.requiredSignals) {
      assert.match(
        `${workspace.description}\n${testCorpus}`,
        signal,
        `${lab.lessonId} 缺少 ${signal} test signal`,
      );
    }

    summaries.push({
      lessonId: lab.lessonId,
      runtime: lab.runtime,
      entryFile: workspace.entryFile,
      files: workspace.files.length,
      testCount,
      testNames: [...testCorpus.matchAll(/\b(?:it|test)\s*\(\s*["'`]([^"'`]+)/g)]
        .map((match) => match[1]),
    });
  }

  console.log(JSON.stringify(summaries, null, 2));
  console.log("typescript labs generation integration OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
