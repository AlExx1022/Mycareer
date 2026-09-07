import assert from "node:assert/strict";
import { getLessonContext } from "@/db/queries/lesson-context";
import {
  countGeneratedTests,
  generateExercise,
  pythonRuntimeValidationErrors,
} from "@/lib/practice-session/llm";
import { validatePracticeWorkspace } from "@/lib/practice-session/workspace";

const LABS = [
  {
    lessonId: "py-job-skills-normalizer",
    requiredSignals: [/alias|同義/i, /duplicate|重複|去重/i, /sort|排序/i],
  },
  {
    lessonId: "py-lazy-pipeline-lab",
    requiredSignals: [/lazy|惰性/i, /iterator|generator/i, /empty|空/i],
  },
  {
    lessonId: "py-typed-cli-capstone",
    requiredSignals: [/JSON/i, /frequency|頻率/i, /empty|空/i, /invalid|malformed|錯/i],
  },
  {
    lessonId: "py-cli-test-refactor-lab",
    requiredSignals: [/read|reader|讀取/i, /write|writer|寫入/i, /malformed|錯/i],
  },
  {
    lessonId: "py-junior-coding-lab",
    requiredSignals: [/empty|空/i, /duplicate|重複/i, /tie|同分/i],
  },
] as const;

async function main() {
  const summaries = [];

  for (const lab of LABS) {
    const context = await getLessonContext(lab.lessonId, {
      includeDraft: true,
    });
    assert.ok(context, `找不到 ${lab.lessonId}`);
    assert.equal(context.lessonType, "practice");
    assert.equal(context.practiceRuntime, "python");
    assert.ok(context.practiceBlueprint);

    const workspace = await generateExercise(context);
    assert.deepEqual(validatePracticeWorkspace(workspace, "python"), []);
    assert.deepEqual(pythonRuntimeValidationErrors(workspace), []);
    const testCount = countGeneratedTests(workspace, "python");
    assert.ok(
      testCount >= 4 && testCount <= 6,
      `${lab.lessonId} 生成測試必須為 4–6 條，目前 ${testCount}`,
    );
    const testCorpus = workspace.files
      .filter(({ role }) => role === "test")
      .map(({ code }) => code)
      .join("\n");
    for (const signal of lab.requiredSignals) {
      assert.match(
        `${workspace.description}\n${testCorpus}`,
        signal,
        `${lab.lessonId} 缺少 ${signal} test signal`,
      );
    }

    summaries.push({
      lessonId: lab.lessonId,
      entryFile: workspace.entryFile,
      files: workspace.files.length,
      testCount,
      testNames: [
        ...testCorpus.matchAll(/^\s*def\s+(test_[A-Za-z0-9_]+)\s*\(/gm),
      ].map((match) => match[1]),
    });
  }

  console.log(JSON.stringify(summaries, null, 2));
  console.log("python labs generation integration OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
