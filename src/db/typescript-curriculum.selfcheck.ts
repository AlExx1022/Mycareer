import assert from "node:assert/strict";
import {
  javascriptInterviewCoreCurriculum,
  reactJuniorMidCurriculum,
  resolvePracticeRuntime,
  typescriptFrontendCoreCurriculum,
} from "./curriculum";

const path = typescriptFrontendCoreCurriculum;
const lessons = path.units.flatMap((curriculumUnit) => curriculumUnit.lessons);
const concepts = lessons.filter((lesson) => lesson.type === "concept");
const practices = lessons.filter((lesson) => lesson.type === "practice");

assert.equal(javascriptInterviewCoreCurriculum.status, "published");
assert.equal(reactJuniorMidCurriculum.position, 2);
assert.equal(path.status, "published");
assert.equal(path.position, 1);
assert.equal(path.subject, "TypeScript");
assert.equal(path.codeLanguage, "TypeScript");
assert.equal(path.defaultPracticeRuntime, "vanilla-ts");
assert.deepEqual(path.recommendedPrerequisitePathIds, [
  "javascript-interview-core",
]);
assert.equal(path.units.length, 3);
assert.equal(lessons.length, 18);
assert.equal(concepts.length, 15);
assert.equal(practices.length, 3);
assert.deepEqual(
  lessons.map(({ slug }) => slug),
  [
    "ts-compile-time-runtime-erasure",
    "ts-inference-annotation-boundaries",
    "ts-everyday-value-shapes",
    "ts-any-unknown-never-void",
    "ts-strict-nullability",
    "ts-assertions-runtime-validation",
    "ts-unsafe-any-clinic",
    "ts-type-interface-structural-typing",
    "ts-function-contracts",
    "ts-literal-union-modeling",
    "ts-built-in-narrowing",
    "ts-discriminated-union-never",
    "ts-generics-relationships-constraints",
    "ts-async-state-machine-lab",
    "ts-keyof-indexed-access",
    "ts-core-utility-types",
    "ts-react-typed-boundaries",
    "ts-typed-data-page-capstone",
  ],
);

for (const [index, lesson] of lessons.entries()) {
  assert.deepEqual(
    lesson.dependsOn,
    index === 0 ? [] : [lessons[index - 1].slug],
    `${lesson.slug} 必須形成單一路徑 DAG 主鏈`,
  );
}

for (const lesson of concepts) {
  assert.ok(
    lesson.examPoints.length >= 2 && lesson.examPoints.length <= 3,
    `${lesson.slug} 必須有 2–3 個 examPoints`,
  );
  assert.ok(lesson.rubric.length >= 2, `${lesson.slug} 必須有至少兩條 rubric`);
  assert.ok(lesson.intro.scenarios.length >= 2);
  const boundaryCorpus = [
    ...lesson.examPoints,
    ...lesson.rubric.flatMap(({ criterion, passCondition }) => [
      criterion,
      passCondition,
    ]),
  ].join(" ");
  assert.match(
    boundaryCorpus,
    /compile|compiler|型別|靜態/i,
    `${lesson.slug} 缺少 compile-time 邊界`,
  );
  assert.match(
    boundaryCorpus,
    /runtime|執行期|執行時|JavaScript/i,
    `${lesson.slug} 缺少 runtime 邊界`,
  );
}

assert.deepEqual(
  practices.map((lesson) => resolvePracticeRuntime(path, lesson)),
  ["vanilla-ts", "vanilla-ts", "react-ts"],
);
for (const lesson of practices) {
  assert.ok(lesson.practiceBlueprint.requirements.length >= 4);
  assert.ok(lesson.practiceBlueprint.edgeCases.length >= 3);
  assert.ok(lesson.practiceBlueprint.followUps.length >= 2);
  assert.ok(lesson.practiceBlueprint.starterSignature);
  const safetyCorpus = [
    ...lesson.examPoints,
    ...lesson.practiceBlueprint.requirements,
    ...lesson.rubric.flatMap(({ criterion, passCondition }) => [
      criterion,
      passCondition,
    ]),
  ].join(" ");
  assert.match(safetyCorpus, /any/i);
  assert.match(safetyCorpus, /assertion|斷言/i);
  assert.match(safetyCorpus, /runtime/i);
}

const coreCorpus = concepts
  .flatMap(({ title, examPoints }) => [title, ...examPoints])
  .join(" ");
for (const forbidden of [
  /conditional type/i,
  /\binfer\b/i,
  /recursive type/i,
  /template literal type/i,
  /variance/i,
  /decorator/i,
  /module augmentation/i,
  /polymorphic component/i,
]) {
  assert.doesNotMatch(coreCorpus, forbidden);
}

console.log("typescript curriculum selfcheck OK");
