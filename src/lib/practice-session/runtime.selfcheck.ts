import assert from "node:assert";
import { PRACTICE_RUNTIME_FIXTURES } from "./fixtures";
import { JAVASCRIPT_LAB_FIXTURES } from "./javascript-lab-fixtures";
import { TYPESCRIPT_LAB_FIXTURES } from "./typescript-lab-fixtures";
import { PyodidePracticeRunner, type WorkerLike } from "./python-runner";
import {
  normalizeSandpackResult,
  type PracticeRunnerResult,
} from "./runner";
import { createSandpackAdapter } from "./sandpack-adapters";
import type {
  PythonWorkerRequest,
  PythonWorkerResponse,
} from "./python-protocol";
import {
  LEGACY_REACT_ENTRY_FILE,
  normalizePracticeWorkspace,
  sanitizeEditableUserFiles,
  validatePracticeWorkspace,
  type LegacyPracticeExercise,
} from "./workspace";

const legacyExercise: LegacyPracticeExercise = {
  description: "既有 React 題目",
  starterCode: "export const value = 1;",
  testCode: "it('works', () => expect(value).toBe(1));",
};
const legacy = normalizePracticeWorkspace(legacyExercise, {
  userCode: "export const value = 2;",
});
assert.equal(legacy.workspace.version, 2);
assert.equal(legacy.workspace.entryFile, LEGACY_REACT_ENTRY_FILE);
assert.equal(
  legacy.userFiles[LEGACY_REACT_ENTRY_FILE],
  "export const value = 2;",
  "舊 userCode 應映射到 entry file",
);
assert.equal(
  legacy.workspace.files.find((file) => file.role === "setup")?.readOnly,
  true,
  "舊 React workspace 應保留 jest-dom setup",
);

const resumed = normalizePracticeWorkspace(legacy.workspace, {
  userCode: "legacy",
  userFiles: { [LEGACY_REACT_ENTRY_FILE]: "new workspace value" },
});
assert.equal(
  resumed.userFiles[LEGACY_REACT_ENTRY_FILE],
  "new workspace value",
  "userFiles 應優先於 userCode",
);
assert.deepEqual(
  sanitizeEditableUserFiles(resumed.workspace, resumed.userFiles),
  resumed.userFiles,
);
assert.equal(
  sanitizeEditableUserFiles(resumed.workspace, {
    ...resumed.userFiles,
    "/exercise.test.tsx": "竄改測試",
  }),
  null,
  "autosave 不得接受唯讀或未知檔案",
);

for (const fixture of Object.values(PRACTICE_RUNTIME_FIXTURES)) {
  assert.deepEqual(
    validatePracticeWorkspace(fixture.workspace, fixture.runtime),
    [],
    `${fixture.runtime} fixture 應符合 workspace contract`,
  );
}
assert.equal(JAVASCRIPT_LAB_FIXTURES.length, 5);
for (const fixture of JAVASCRIPT_LAB_FIXTURES) {
  assert.deepEqual(
    validatePracticeWorkspace(fixture.workspace, "vanilla-js"),
    [],
    `${fixture.lessonId} fixture 應符合 vanilla-js workspace contract`,
  );
}

assert.equal(TYPESCRIPT_LAB_FIXTURES.length, 3);
for (const fixture of TYPESCRIPT_LAB_FIXTURES) {
  assert.deepEqual(
    validatePracticeWorkspace(fixture.workspace, fixture.runtime),
    [],
    `${fixture.lessonId} fixture 應符合 ${fixture.runtime} workspace contract`,
  );
  const resumed = normalizePracticeWorkspace(fixture.workspace, {
    userFiles: fixture.validUserFiles,
  });
  assert.deepEqual(
    resumed.userFiles,
    fixture.validUserFiles,
    `${fixture.lessonId} resume 應還原所有可編輯檔案`,
  );
  assert.deepEqual(
    sanitizeEditableUserFiles(fixture.workspace, resumed.userFiles),
    fixture.validUserFiles,
    `${fixture.lessonId} autosave payload 應通過白名單過濾`,
  );
  const readOnlyPath = fixture.workspace.files.find(
    ({ readOnly }) => readOnly,
  )?.path;
  assert.ok(readOnlyPath, `${fixture.lessonId} 應包含唯讀測試檔`);
  assert.equal(
    sanitizeEditableUserFiles(fixture.workspace, {
      ...resumed.userFiles,
      [readOnlyPath]: "竄改測試",
    }),
    null,
    `${fixture.lessonId} autosave 不得覆寫唯讀測試檔`,
  );
}

const reactAdapter = createSandpackAdapter(
  "react-ts",
  PRACTICE_RUNTIME_FIXTURES["react-ts"].workspace,
);
assert.equal(reactAdapter.template, "react-ts");
assert.ok(reactAdapter.customSetup?.dependencies["@testing-library/react"]);
assert.match(
  (reactAdapter.files["/Counter.test.tsx"] as { code: string }).code,
  /jest-dom/,
  "react setup 應在 test 執行前載入",
);
assert.equal(
  createSandpackAdapter(
    "vanilla-ts",
    PRACTICE_RUNTIME_FIXTURES["vanilla-ts"].workspace,
  ).template,
  "vanilla-ts",
);
assert.equal(
  createSandpackAdapter(
    "vanilla-js",
    PRACTICE_RUNTIME_FIXTURES["vanilla-js"].workspace,
  ).template,
  "vanilla",
);
assert.ok(
  createSandpackAdapter(
    "vanilla-js",
    JAVASCRIPT_LAB_FIXTURES[0].workspace,
  ).customSetup?.dependencies["@babel/preset-env"],
  "vanilla-js 應以 Babel preset-env 支援現代 JavaScript 語法",
);
assert.match(
  (
    createSandpackAdapter(
      "vanilla-js",
      JAVASCRIPT_LAB_FIXTURES[0].workspace,
    ).files["/index.js"] as { code: string }
  ).code,
  /predictions\.js/,
  "vanilla-js 非 index entry 應注入隱藏 bootstrap，讓測試前完成 transpile",
);

assert.deepEqual(
  normalizeSandpackResult({
    suite: {
      tests: {
        one: { name: "第一條", status: "pass" },
        two: { name: "第二條", status: "pass" },
      },
    },
  }),
  {
    passed: true,
    tests: [
      { name: "第一條", status: "pass" },
      { name: "第二條", status: "pass" },
    ],
    diagnostics: [],
  },
);
assert.equal(
  normalizeSandpackResult({
    compile: { error: { message: "Type 'string' is not assignable", line: 3 } },
  }).passed,
  false,
  "compile diagnostics 存在時不可通過",
);

class FakeWorker implements WorkerLike {
  onmessage: ((event: MessageEvent<PythonWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;

  constructor(private readonly behavior: "timeout" | "pass") {
    setTimeout(
      () =>
        this.onmessage?.({
          data: { type: "ready" },
        } as MessageEvent<PythonWorkerResponse>),
      0,
    );
  }

  postMessage(message: PythonWorkerRequest) {
    if (this.behavior === "timeout") return;
    const result: PracticeRunnerResult = {
      passed: true,
      tests: [{ name: "test_fixture", status: "pass" }],
      diagnostics: [],
    };
    setTimeout(
      () =>
        this.onmessage?.({
          data: { type: "result", id: message.id, result },
        } as MessageEvent<PythonWorkerResponse>),
      0,
    );
  }

  terminate() {
    this.terminated = true;
  }
}

async function checkPythonTimeoutRecovery() {
  const workers: FakeWorker[] = [];
  const behaviors: Array<"timeout" | "pass"> = ["timeout", "pass"];
  const runner = new PyodidePracticeRunner(
    () => {
      const worker = new FakeWorker(behaviors.shift() ?? "pass");
      workers.push(worker);
      return worker;
    },
    5,
    100,
  );
  const workspace = PRACTICE_RUNTIME_FIXTURES.python.workspace;
  const timeoutResult = await runner.run(workspace);
  assert.equal(timeoutResult.passed, false);
  assert.match(timeoutResult.runtimeError ?? "", /已終止並重建/);
  assert.equal(workers[0]?.terminated, true, "逾時 worker 必須 terminate");

  const recoveredResult = await runner.run(workspace);
  assert.equal(recoveredResult.passed, true, "逾時後下一次 run 應建立新 worker");
  assert.equal(workers.length, 2);
  runner.dispose();
}

checkPythonTimeoutRecovery()
  .then(() => console.log("practice runtime self-check OK"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
