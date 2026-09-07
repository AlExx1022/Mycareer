import assert from "node:assert/strict";
import { curricula, type CurriculumPath } from "./curriculum";
import { assertCurricula, planPathPrune } from "./seed-skill-tree";

const conceptLesson = (slug: string, dependsOn: string[] = []) => ({
  slug,
  title: slug,
  type: "concept" as const,
  topic: "fixture",
  dependsOn,
  intro: {
    hook: "fixture hook",
    scenarios: ["fixture scenario"],
    outcome: "fixture outcome",
  },
  examPoints: ["fixture exam point"],
  rubric: [{ criterion: "fixture criterion", passCondition: "fixture pass" }],
});

const fixturePath = (
  id: string,
  lessonIds: string[],
  recommendedPrerequisitePathIds: string[] = [],
): CurriculumPath => ({
  id,
  title: id,
  description: `${id} description`,
  subject: id,
  codeLanguage: "TypeScript",
  status: "draft",
  position: id === "fixture-a" ? 0 : 1,
  recommendedPrerequisitePathIds,
  units: [
    {
      slug: `${id}-unit`,
      title: `${id} unit`,
      lessons: lessonIds.map((lessonId) => conceptLesson(lessonId)),
    },
  ],
});

assert.doesNotThrow(() => assertCurricula(curricula));
const reactCurriculum = curricula.find(({ id }) => id === "react-junior-mid");
const javascriptCurriculum = curricula.find(
  ({ id }) => id === "javascript-interview-core",
);
assert.ok(reactCurriculum);
assert.ok(javascriptCurriculum);
assert.deepEqual(
  reactCurriculum.units.map((curriculumUnit) => curriculumUnit.slug),
  ["react-core-model", "hooks-and-data-flow"],
);

const reactLessons = reactCurriculum.units.flatMap((curriculumUnit) =>
  curriculumUnit.lessons.map((curriculumLesson) => curriculumLesson.slug),
);
assert.deepEqual(reactLessons, [
  "jsx-compiles-to-what",
  "render-and-commit",
  "why-not-touch-dom",
  "one-way-data-flow",
  "props-are-readonly",
  "children-composition",
  "usestate-batching",
  "state-immutability",
  "functional-updates",
  "list-keys",
  "conditional-rendering-pitfalls",
  "controlled-forms",
  "component-composition",
  "effect-dependencies",
  "effect-cleanup",
  "effect-misuse",
  "stale-closure-diagnosis",
  "stale-closure-fixes",
  "rules-of-hooks",
  "extracting-custom-hooks",
  "referential-equality-rerender",
  "memoization-tradeoffs",
  "debounce-hook",
  "data-fetching-pattern",
]);
const reactPracticeLessons = reactCurriculum.units
  .flatMap((curriculumUnit) => curriculumUnit.lessons)
  .filter((curriculumLesson) => curriculumLesson.type === "practice");
assert.equal(reactPracticeLessons.length, 4);
for (const curriculumLesson of reactPracticeLessons) {
  assert.equal(curriculumLesson.practiceRuntime, "react-ts");
  assert.ok(curriculumLesson.practiceBlueprint.requirements.length > 0);
  assert.ok(curriculumLesson.practiceBlueprint.edgeCases.length > 0);
}

const javascriptLessons = javascriptCurriculum.units.flatMap(
  (curriculumUnit) => curriculumUnit.lessons,
);
const javascriptConcepts = javascriptLessons.filter(
  (curriculumLesson) => curriculumLesson.type === "concept",
);
const javascriptPractices = javascriptLessons.filter(
  (curriculumLesson) => curriculumLesson.type === "practice",
);
assert.equal(javascriptCurriculum.status, "published");
assert.equal(javascriptCurriculum.position, 0);
assert.equal(javascriptCurriculum.subject, "JavaScript");
assert.equal(javascriptCurriculum.codeLanguage, "JavaScript");
assert.equal(javascriptCurriculum.defaultPracticeRuntime, "vanilla-js");
assert.equal(javascriptCurriculum.units.length, 5);
assert.equal(javascriptLessons.length, 28);
assert.equal(javascriptConcepts.length, 23);
assert.equal(javascriptPractices.length, 5);
assert.deepEqual(
  javascriptLessons.map(({ slug }) => slug),
  [
    "js-runtime-values-types",
    "js-absent-values-type-checks",
    "js-truthiness-and-defaulting",
    "js-coercion-and-equality",
    "js-identity-mutation-copy",
    "js-output-reasoning-lab",
    "js-variable-scopes",
    "js-hoisting-and-tdz",
    "js-function-forms-and-callbacks",
    "js-lexical-scope-and-closure",
    "js-this-and-binding",
    "js-closure-this-debug-lab",
    "js-array-method-contracts",
    "js-mutating-array-apis",
    "js-map-set-data-selection",
    "js-prototype-chain-and-class",
    "js-data-transform-lab",
    "js-event-loop-tasks-microtasks",
    "js-promise-chaining",
    "js-promise-error-flow",
    "js-async-await-concurrency",
    "js-async-race-and-cancellation",
    "js-promise-concurrency-lab",
    "js-es-modules",
    "js-error-boundaries-debugging",
    "js-dom-events-delegation",
    "js-fetch-http-cors",
    "js-autocomplete-capstone",
  ],
);
assert.deepEqual(reactCurriculum.recommendedPrerequisitePathIds, [
  javascriptCurriculum.id,
]);

for (const [index, curriculumLesson] of javascriptLessons.entries()) {
  assert.deepEqual(
    curriculumLesson.dependsOn,
    index === 0 ? [] : [javascriptLessons[index - 1].slug],
    `${curriculumLesson.slug} 必須形成單一路徑 DAG 主鏈`,
  );
}
for (const curriculumLesson of javascriptConcepts) {
  assert.ok(
    curriculumLesson.examPoints.length >= 2 &&
      curriculumLesson.examPoints.length <= 3,
    `${curriculumLesson.slug} 必須有 2–3 個 examPoints`,
  );
  assert.ok(
    curriculumLesson.rubric.length >= 2,
    `${curriculumLesson.slug} 必須有至少兩條 rubric`,
  );
  assert.ok(curriculumLesson.intro.scenarios.length >= 2);
}
for (const curriculumLesson of javascriptPractices) {
  assert.equal(curriculumLesson.practiceRuntime, "vanilla-js");
  assert.ok(curriculumLesson.practiceBlueprint.requirements.length >= 4);
  assert.ok(curriculumLesson.practiceBlueprint.edgeCases.length >= 3);
  assert.ok(curriculumLesson.practiceBlueprint.followUps.length >= 2);
  assert.ok(curriculumLesson.practiceBlueprint.starterSignature);
}

const rubricCorpus = javascriptLessons
  .flatMap(({ rubric }) => rubric.flatMap(({ criterion, passCondition }) => [criterion, passCondition]))
  .join(" ");
assert.match(rubricCorpus, /解釋/);
assert.match(rubricCorpus, /推理|預測/);
assert.match(rubricCorpus, /選擇|實作|修復|診斷/);

const pathA = fixturePath("fixture-a", ["fixture-a-keep"]);
const pathB = fixturePath("fixture-b", ["fixture-b-keep"], ["fixture-a"]);
assert.doesNotThrow(() => assertCurricula([pathA, pathB]));

const persistedUnits = [
  { id: "fixture-a-unit", pathId: "fixture-a" },
  { id: "fixture-a-stale-unit", pathId: "fixture-a" },
  { id: "fixture-b-unit", pathId: "fixture-b" },
];
const persistedLessons = [
  { id: "fixture-a-keep", unitId: "fixture-a-unit" },
  { id: "fixture-a-stale", unitId: "fixture-a-unit" },
  { id: "fixture-a-stale-unit-lesson", unitId: "fixture-a-stale-unit" },
  { id: "fixture-b-keep", unitId: "fixture-b-unit" },
];
const prunePlan = planPathPrune(pathA, persistedUnits, persistedLessons);
assert.deepEqual(prunePlan.staleUnitIds, ["fixture-a-stale-unit"]);
assert.deepEqual(prunePlan.staleLessonIds, [
  "fixture-a-stale",
  "fixture-a-stale-unit-lesson",
]);
assert.ok(!prunePlan.staleUnitIds.includes("fixture-b-unit"));
assert.ok(!prunePlan.staleLessonIds.includes("fixture-b-keep"));

const deletedLessonIds = new Set(prunePlan.staleLessonIds);
const masteryRows = [
  { userId: "user", lessonId: "fixture-a-stale" },
  { userId: "user", lessonId: "fixture-b-keep" },
];
const sessionRows = [
  { kind: "lesson", userId: "user", lessonId: "fixture-b-keep" },
  { kind: "practice", userId: "user", lessonId: "fixture-b-keep" },
  { kind: "review", userId: "user", lessonId: "fixture-b-keep" },
];
assert.deepEqual(
  masteryRows.filter(({ lessonId }) => !deletedLessonIds.has(lessonId)),
  [{ userId: "user", lessonId: "fixture-b-keep" }],
);
assert.equal(
  sessionRows.filter(({ lessonId }) => !deletedLessonIds.has(lessonId)).length,
  sessionRows.length,
);

const crossPathDependency: CurriculumPath = {
  ...pathB,
  units: [
    {
      ...pathB.units[0],
      lessons: [conceptLesson("fixture-b-keep", ["fixture-a-keep"])],
    },
  ],
};
assert.throws(
  () => assertCurricula([pathA, crossPathDependency]),
  /fixture-b\/fixture-b-keep.*fixture-a\/fixture-a-keep/,
);

const cyclicPath: CurriculumPath = {
  ...pathA,
  units: [
    {
      ...pathA.units[0],
      lessons: [
        conceptLesson("fixture-cycle-a", ["fixture-cycle-b"]),
        conceptLesson("fixture-cycle-b", ["fixture-cycle-a"]),
      ],
    },
  ],
};
assert.throws(() => assertCurricula([cyclicPath]), /循環依賴/);

const incompletePracticePath = {
  ...pathA,
  units: [
    {
      ...pathA.units[0],
      lessons: [
        {
          ...conceptLesson("fixture-practice"),
          type: "practice",
          intro: undefined,
        },
      ],
    },
  ],
} as unknown as CurriculumPath;
assert.throws(
  () => assertCurricula([incompletePracticePath]),
  /practice runtime/,
);

const invalidConceptMetadataPath = {
  ...pathA,
  units: [
    {
      ...pathA.units[0],
      lessons: [
        {
          ...conceptLesson("fixture-concept-with-runtime"),
          practiceRuntime: "react-ts",
        },
      ],
    },
  ],
} as unknown as CurriculumPath;
assert.throws(
  () => assertCurricula([invalidConceptMetadataPath]),
  /concept 不得含 practice metadata/,
);

console.log("seed skill-tree self-check OK");
