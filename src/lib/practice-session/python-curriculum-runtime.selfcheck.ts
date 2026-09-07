import assert from "node:assert/strict";
import { countGeneratedTests, pythonRuntimeValidationErrors } from "./llm";
import { PYTHON_LAB_FIXTURES } from "./python-lab-fixtures";
import {
  normalizePracticeWorkspace,
  sanitizeEditableUserFiles,
  validatePracticeWorkspace,
} from "./workspace";

assert.equal(PYTHON_LAB_FIXTURES.length, 5);
assert.deepEqual(
  PYTHON_LAB_FIXTURES.map(({ lessonId }) => lessonId),
  [
    "py-job-skills-normalizer",
    "py-lazy-pipeline-lab",
    "py-typed-cli-capstone",
    "py-cli-test-refactor-lab",
    "py-junior-coding-lab",
  ],
);

for (const fixture of PYTHON_LAB_FIXTURES) {
  assert.deepEqual(
    validatePracticeWorkspace(fixture.workspace, "python"),
    [],
    `${fixture.lessonId} workspace 應符合 Python contract`,
  );
  assert.deepEqual(
    pythonRuntimeValidationErrors(fixture.workspace),
    [],
    `${fixture.lessonId} 不得依賴不支援的 runtime capability`,
  );
  const testCount = countGeneratedTests(fixture.workspace, "python");
  assert.ok(
    testCount >= 4 && testCount <= 6,
    `${fixture.lessonId} 必須有 4–6 條測試，目前 ${testCount}`,
  );
  const resumed = normalizePracticeWorkspace(fixture.workspace, {
    userFiles: fixture.validUserFiles,
  });
  assert.deepEqual(resumed.userFiles, fixture.validUserFiles);
  assert.deepEqual(
    sanitizeEditableUserFiles(fixture.workspace, resumed.userFiles),
    fixture.validUserFiles,
  );
  assert.match(
    fixture.infiniteLoopUserFiles[fixture.workspace.entryFile] ?? "",
    /while True:/,
  );
}

console.log("python curriculum runtime selfcheck OK");
