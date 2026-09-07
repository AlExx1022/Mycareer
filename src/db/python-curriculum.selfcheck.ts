import assert from "node:assert/strict";
import {
  javascriptInterviewCoreCurriculum,
  pythonInterviewCoreCurriculum,
  reactJuniorMidCurriculum,
  resolvePracticeRuntime,
  typescriptFrontendCoreCurriculum,
} from "./curriculum";

const path = pythonInterviewCoreCurriculum;
const lessons = path.units.flatMap((unit) => unit.lessons);
const concepts = lessons.filter((lesson) => lesson.type === "concept");
const practices = lessons.filter((lesson) => lesson.type === "practice");

assert.equal(javascriptInterviewCoreCurriculum.status, "published");
assert.equal(javascriptInterviewCoreCurriculum.position, 0);
assert.equal(typescriptFrontendCoreCurriculum.status, "published");
assert.equal(typescriptFrontendCoreCurriculum.position, 1);
assert.equal(reactJuniorMidCurriculum.position, 2);
assert.equal(path.status, "published");
assert.equal(path.position, 3);
assert.equal(path.subject, "Python");
assert.equal(path.codeLanguage, "Python");
assert.equal(path.defaultPracticeRuntime, "python");
assert.deepEqual(path.recommendedPrerequisitePathIds, []);
assert.equal(path.units.length, 4);
assert.equal(lessons.length, 22);
assert.equal(concepts.length, 17);
assert.equal(practices.length, 5);

assert.deepEqual(
  lessons.map(({ slug }) => slug),
  [
    "py-syntax-truthiness-control-flow",
    "py-binding-mutability",
    "py-equality-identity-hashability",
    "py-collections-selection",
    "py-pythonic-iteration-transform",
    "py-job-skills-normalizer",
    "py-function-signatures",
    "py-mutable-default-trap",
    "py-legb-closure-late-binding",
    "py-iterable-iterator-generator",
    "py-decorator-fundamentals",
    "py-lazy-pipeline-lab",
    "py-exceptions-context-managers",
    "py-modules-packages-imports",
    "py-venv-pyproject-dependencies",
    "py-type-hints-runtime-boundary",
    "py-testing-fixtures-boundaries",
    "py-typed-cli-capstone",
    "py-cli-test-refactor-lab",
    "py-classes-dataclasses",
    "py-composition-duck-typing",
    "py-junior-coding-lab",
  ],
);

for (const [index, lesson] of lessons.entries()) {
  assert.deepEqual(
    lesson.dependsOn,
    index === 0 ? [] : [lessons[index - 1].slug],
    `${lesson.slug} 必須形成同 path 單一路徑 DAG`,
  );
}

for (const lesson of concepts) {
  assert.ok(
    lesson.examPoints.length >= 2 && lesson.examPoints.length <= 3,
    `${lesson.slug} 必須有 2–3 個 examPoints`,
  );
  assert.ok(lesson.rubric.length >= 2, `${lesson.slug} 必須有至少兩條 rubric`);
  assert.ok(lesson.intro.hook.length > 20);
  assert.ok(lesson.intro.scenarios.length >= 2);
  assert.ok(lesson.intro.outcome.length > 20);
}

assert.deepEqual(
  practices.map((lesson) => resolvePracticeRuntime(path, lesson)),
  ["python", "python", "python", "python", "python"],
);
for (const lesson of practices) {
  assert.ok(lesson.practiceBlueprint.requirements.length >= 4);
  assert.ok(lesson.practiceBlueprint.edgeCases.length >= 3);
  assert.ok(lesson.practiceBlueprint.followUps.length >= 2);
  assert.ok(lesson.practiceBlueprint.starterSignature);
  assert.ok(lesson.practiceBlueprint.timeboxMinutes <= 60);
  const corpus = [
    ...lesson.examPoints,
    ...lesson.rubric.flatMap(({ criterion, passCondition }) => [
      criterion,
      passCondition,
    ]),
    ...lesson.practiceBlueprint.requirements,
    ...lesson.practiceBlueprint.followUps,
  ].join(" ");
  assert.match(corpus, /Python|標準函式庫|Pyodide/i);
  assert.match(corpus, /Big-O|複雜度|O\([^)]+\)/i);
}

const capstone = practices.find(
  ({ slug }) => slug === "py-typed-cli-capstone",
);
assert.ok(capstone);
const capstoneCorpus = [
  capstone.practiceBlueprint.objective,
  ...capstone.practiceBlueprint.requirements,
  ...capstone.practiceBlueprint.edgeCases,
  ...capstone.practiceBlueprint.followUps,
].join(" ");
for (const required of [
  /resume JSON/i,
  /job JSON|CSV/i,
  /casefold/i,
  /frequency/i,
  /Markdown/i,
  /src\/skill_gap_cli/i,
  /pyproject/i,
  /pytest/i,
  /malformed JSON/i,
  /UTF-8/i,
]) {
  assert.match(capstoneCorpus, required, `capstone contract 缺少 ${required}`);
}

const titleCorpus = lessons.map(({ title }) => title).join(" ");
for (const forbidden of [
  /Django|Flask|FastAPI|SQLAlchemy/i,
  /ORM|Database|資料庫/i,
  /asyncio|GIL/i,
  /NumPy|Pandas|Machine Learning|Data Science/i,
  /metaclass|descriptor|MRO/i,
  /Tree|Graph|Dynamic Programming|DP/i,
]) {
  assert.doesNotMatch(titleCorpus, forbidden);
}

console.log("python curriculum selfcheck OK");
