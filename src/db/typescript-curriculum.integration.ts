import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getLessonContext } from "@/db/queries/lesson-context";
import { getSkillTreeForUser } from "@/db/queries/skill-tree";
import { systemPrompt } from "@/lib/lesson-session/graph";

const PATH_ID = "typescript-frontend-core";
const samples = [
  {
    lessonId: "ts-compile-time-runtime-erasure",
    required: [/compile time/i, /runtime/i, /擦除/],
  },
  {
    lessonId: "ts-any-unknown-never-void",
    required: [/unknown/i, /narrow/i, /never/i],
  },
  {
    lessonId: "ts-discriminated-union-never",
    required: [/discriminant/i, /never/i, /非法組合|互斥/],
  },
  {
    lessonId: "ts-generics-relationships-constraints",
    required: [/關係|連結/, /constraint|extends/i, /runtime/i],
  },
  {
    lessonId: "ts-react-typed-boundaries",
    required: [/currentTarget/i, /nullable ref|ref.*null/i, /unknown/i],
  },
];

const practices = [
  { lessonId: "ts-unsafe-any-clinic", runtime: "vanilla-ts" },
  { lessonId: "ts-async-state-machine-lab", runtime: "vanilla-ts" },
  { lessonId: "ts-typed-data-page-capstone", runtime: "react-ts" },
] as const;

async function main() {
  for (const sample of samples) {
    const context = await getLessonContext(sample.lessonId);
    assert.ok(context, `找不到 ${sample.lessonId}`);
    assert.equal(context.pathId, PATH_ID);
    assert.equal(context.subject, "TypeScript");
    assert.equal(context.codeLanguage, "TypeScript");
    assert.equal(context.lessonType, "concept");
    assert.equal(context.practiceRuntime, null);
    assert.equal(context.practiceBlueprint, null);

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
    const prompt = systemPrompt(context, "提出一題可判定的面試檢核。");
    assert.match(prompt, /TypeScript Frontend Core/);
    assert.match(prompt, /這個 TypeScript 概念節點/);
    assert.match(prompt, /code fence 使用 TypeScript/);
  }

  for (const practice of practices) {
    const context = await getLessonContext(practice.lessonId);
    assert.ok(context);
    assert.equal(context.lessonType, "practice");
    assert.equal(context.practiceRuntime, practice.runtime);
    assert.ok(context.practiceBlueprint);
    const safetyCorpus = [
      ...context.rubric.map(({ passCondition }) => passCondition),
      ...context.practiceBlueprint.requirements,
    ].join(" ");
    assert.match(safetyCorpus, /any/i);
    assert.match(safetyCorpus, /assertion|斷言/i);
  }

  const [demoUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, process.env.DEMO_EMAIL ?? "demo@example.com"));
  assert.ok(demoUser, "找不到 demo user");
  const tree = await getSkillTreeForUser(demoUser.id, PATH_ID);
  assert.ok(tree);
  assert.equal(tree.units.length, 3);
  assert.equal(tree.units.flatMap(({ lessons }) => lessons).length, 18);
  assert.deepEqual(tree.recommendedPrerequisites, [
    {
      id: "javascript-interview-core",
      title: "JavaScript Interview Core",
      subject: "JavaScript",
    },
  ]);

  console.log("typescript curriculum DB integration OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
