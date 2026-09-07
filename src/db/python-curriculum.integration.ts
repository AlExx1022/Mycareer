import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { getLessonContext } from "@/db/queries/lesson-context";
import { getSkillTreeForUser } from "@/db/queries/skill-tree";
import { user } from "@/db/schema";
import { systemPrompt } from "@/lib/lesson-session/graph";

const PATH_ID = "python-interview-core";
const samples = [
  {
    lessonId: "py-binding-mutability",
    required: [/binding|綁定/i, /mutation|可變/i, /shallow|巢狀/i],
  },
  {
    lessonId: "py-mutable-default-trap",
    required: [/default/i, /定義|建立時機/i, /sentinel|factory/i],
  },
  {
    lessonId: "py-iterable-iterator-generator",
    required: [/iterator/i, /generator/i, /StopIteration|一次性/i],
  },
  {
    lessonId: "py-type-hints-runtime-boundary",
    required: [/annotation/i, /runtime/i, /validation/i],
  },
  {
    lessonId: "py-testing-fixtures-boundaries",
    required: [/pytest/i, /fixture/i, /mock|adapter/i],
  },
] as const;

const practices = [
  "py-job-skills-normalizer",
  "py-lazy-pipeline-lab",
  "py-typed-cli-capstone",
  "py-cli-test-refactor-lab",
  "py-junior-coding-lab",
];

async function main() {
  for (const sample of samples) {
    const context = await getLessonContext(sample.lessonId);
    assert.ok(context, `找不到 ${sample.lessonId}`);
    assert.equal(context.pathId, PATH_ID);
    assert.equal(context.subject, "Python");
    assert.equal(context.codeLanguage, "Python");
    assert.equal(context.lessonType, "concept");
    const corpus = [
      ...context.examPoints,
      ...context.rubric.flatMap(({ criterion, passCondition }) => [
        criterion,
        passCondition,
      ]),
    ].join(" ");
    for (const pattern of sample.required) {
      assert.match(corpus, pattern, `${sample.lessonId} 缺少 ${pattern}`);
    }
    const prompt = systemPrompt(context, "提出一題可判定的面試檢核。");
    assert.match(prompt, /Python Interview Core/);
    assert.match(prompt, /這個 Python 概念節點/);
    assert.match(prompt, /code fence 使用 Python/);
  }

  for (const lessonId of practices) {
    const context = await getLessonContext(lessonId);
    assert.ok(context);
    assert.equal(context.lessonType, "practice");
    assert.equal(context.practiceRuntime, "python");
    assert.ok(context.practiceBlueprint);
    assert.ok(context.practiceBlueprint.requirements.length >= 4);
  }

  const [demoUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, process.env.DEMO_EMAIL ?? "demo@example.com"));
  assert.ok(demoUser, "找不到 demo user");
  const tree = await getSkillTreeForUser(demoUser.id, PATH_ID);
  assert.ok(tree);
  assert.equal(tree.units.length, 4);
  assert.equal(tree.units.flatMap(({ lessons }) => lessons).length, 22);
  assert.deepEqual(tree.recommendedPrerequisites, []);
  assert.deepEqual(tree.units[0].lessons[0].dependsOn, []);
  assert.equal(tree.units[0].lessons[0].mastery, null);

  console.log("python curriculum DB integration OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
