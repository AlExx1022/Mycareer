import assert from "node:assert/strict";
import { getLessonContext } from "@/db/queries/lesson-context";
import { generateExercise } from "@/lib/practice-session/llm";
import { validatePracticeWorkspace } from "@/lib/practice-session/workspace";

const LAB_IDS = [
  "js-output-reasoning-lab",
  "js-closure-this-debug-lab",
  "js-data-transform-lab",
  "js-promise-concurrency-lab",
  "js-autocomplete-capstone",
];

function countTests(code: string) {
  return [...code.matchAll(/\b(?:it|test)\s*\(/g)].length;
}

async function main() {
  const summaries = [];

  for (const lessonId of LAB_IDS) {
    const context = await getLessonContext(lessonId, { includeDraft: true });
    assert.ok(context, `找不到 ${lessonId}`);
    assert.equal(context.lessonType, "practice");
    assert.equal(context.practiceRuntime, "vanilla-js");
    assert.ok(context.practiceBlueprint);

    const workspace = await generateExercise(context);
    assert.deepEqual(validatePracticeWorkspace(workspace, "vanilla-js"), []);
    const testFiles = workspace.files.filter(({ role }) => role === "test");
    const testCount = testFiles.reduce(
      (total, file) => total + countTests(file.code),
      0,
    );
    assert.ok(testCount >= 4, `${lessonId} 生成測試少於四條`);
    assert.ok(
      workspace.files.some(
        ({ role, readOnly, path }) =>
          role === "starter" && !readOnly && path.endsWith(".js"),
      ),
      `${lessonId} 缺少可編輯 .js starter`,
    );
    assert.ok(
      testFiles.every(({ readOnly, path }) => readOnly && path.endsWith(".js")),
      `${lessonId} test 必須是唯讀 .js`,
    );

    summaries.push({
      lessonId,
      entryFile: workspace.entryFile,
      files: workspace.files.length,
      testCount,
      requirementCount: context.practiceBlueprint.requirements.length,
      edgeCaseCount: context.practiceBlueprint.edgeCases.length,
      testNames: testFiles.flatMap(({ code }) =>
        [...code.matchAll(/\b(?:it|test)\s*\(\s*["'`]([^"'`]+)/g)].map(
          (match) => match[1],
        ),
      ),
    });
  }

  console.log(JSON.stringify(summaries, null, 2));
  console.log("javascript labs generation integration OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
