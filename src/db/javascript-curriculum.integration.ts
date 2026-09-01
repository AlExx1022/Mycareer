import assert from "node:assert/strict";
import { getLessonContext } from "@/db/queries/lesson-context";

const samples = [
  {
    lessonId: "js-coercion-and-equality",
    required: [/轉型|coercion/i, /===/, /推理|預測/],
  },
  {
    lessonId: "js-lexical-scope-and-closure",
    required: [/lexical|closure/i, /binding/, /推理|修復/],
  },
  {
    lessonId: "js-event-loop-tasks-microtasks",
    required: [/microtask/i, /task/, /預測|順序/],
  },
  {
    lessonId: "js-fetch-http-cors",
    required: [/Response\.ok|\bok\b/, /HTTP|network/i, /CORS/],
  },
];

async function main() {
  for (const sample of samples) {
    assert.equal(
      await getLessonContext(sample.lessonId),
      null,
      `${sample.lessonId} 所屬 draft path 不得由一般 lesson query 公開`,
    );
    const context = await getLessonContext(sample.lessonId, {
      includeDraft: true,
    });
    assert.ok(context, `找不到 ${sample.lessonId}`);
    assert.equal(context.pathId, "javascript-interview-core");
    assert.equal(context.subject, "JavaScript");
    assert.equal(context.codeLanguage, "JavaScript");
    assert.equal(context.lessonType, "concept");
    assert.equal(context.practiceRuntime, null);
    assert.equal(context.practiceBlueprint, null);
    assert.ok(context.examPoints.length >= 2 && context.examPoints.length <= 3);
    assert.ok(context.rubric.length >= 2);

    const corpus = [
      ...context.examPoints,
      ...context.rubric.flatMap(({ criterion, passCondition }) => [
        criterion,
        passCondition,
      ]),
    ].join(" ");
    for (const pattern of sample.required) {
      assert.match(corpus, pattern, `${sample.lessonId} 缺少 ${pattern} 驗收訊號`);
    }
  }

  console.log("javascript curriculum context integration OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
