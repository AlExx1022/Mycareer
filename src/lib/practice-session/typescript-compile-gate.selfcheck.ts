import assert from "node:assert/strict";
import path from "node:path";
import ts from "typescript";
import { TYPESCRIPT_LAB_FIXTURES } from "./typescript-lab-fixtures";
import { mergeUserFiles, validatePracticeWorkspace } from "./workspace";

function compileFixture(
  files: Record<string, string>,
  react: boolean,
): ts.Diagnostic[] {
  const fixtureRoot = path.join(process.cwd(), ".typescript-fixture");
  const virtualFiles = new Map(
    Object.entries(files).map(([filePath, code]) => [
      path.join(fixtureRoot, filePath),
      code,
    ]),
  );
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    skipLibCheck: true,
    esModuleInterop: true,
    ...(react ? { types: ["react", "react-dom"] } : {}),
  };
  const baseHost = ts.createCompilerHost(options);
  const host: ts.CompilerHost = {
    ...baseHost,
    fileExists: (fileName) =>
      virtualFiles.has(fileName) || baseHost.fileExists(fileName),
    directoryExists: (directoryName) =>
      directoryName === fixtureRoot ||
      directoryName.startsWith(`${fixtureRoot}${path.sep}`) ||
      (baseHost.directoryExists?.(directoryName) ?? false),
    readFile: (fileName) =>
      virtualFiles.get(fileName) ?? baseHost.readFile(fileName),
    getSourceFile: (fileName, languageVersion) => {
      const source = virtualFiles.get(fileName);
      return source === undefined
        ? baseHost.getSourceFile(fileName, languageVersion)
        : ts.createSourceFile(fileName, source, languageVersion, true);
    },
  };
  const program = ts.createProgram({
    rootNames: [...virtualFiles.keys()],
    options,
    host,
  });
  return ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file?.fileName.startsWith(fixtureRoot));
}

for (const fixture of TYPESCRIPT_LAB_FIXTURES) {
  assert.deepEqual(validatePracticeWorkspace(fixture.workspace, fixture.runtime), []);

  const validWorkspace = mergeUserFiles(
    fixture.workspace,
    fixture.validUserFiles,
  );
  const validFiles = Object.fromEntries(
    validWorkspace.files
      .filter(({ readOnly }) => !readOnly)
      .map(({ path: filePath, code }) => [filePath, code]),
  );
  const validDiagnostics = compileFixture(
    validFiles,
    fixture.runtime === "react-ts",
  );
  assert.deepEqual(
    validDiagnostics.map(({ code }) => code),
    [],
    `${fixture.lessonId} valid fixture 應通過 strict compile gate：${validDiagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "))
      .join("；")}`,
  );

  const failingWorkspace = mergeUserFiles(
    fixture.workspace,
    fixture.runtimePassTypeFailureFiles,
  );
  const failingFiles = Object.fromEntries(
    failingWorkspace.files
      .filter(({ readOnly }) => !readOnly)
      .map(({ path: filePath, code }) => [filePath, code]),
  );
  const diagnostics = compileFixture(
    failingFiles,
    fixture.runtime === "react-ts",
  );
  assert.ok(
    diagnostics.some(({ code }) => code === 2322),
    `${fixture.lessonId} runtime-pass fixture 必須含 assignability diagnostic`,
  );
}

console.log("typescript compile gate selfcheck OK");
