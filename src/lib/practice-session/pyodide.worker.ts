/// <reference lib="webworker" />

import type {
  PythonWorkerRequest,
  PythonWorkerResponse,
} from "./python-protocol";

export const PYODIDE_VERSION = "0.27.7";
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const WORKSPACE_ROOT = "/practice-workspace";

type Pyodide = {
  FS: {
    analyzePath(path: string): { exists: boolean };
    mkdirTree(path: string): void;
    readdir(path: string): string[];
    isDir(mode: number): boolean;
    stat(path: string): { mode: number };
    unlink(path: string): void;
    rmdir(path: string): void;
    writeFile(path: string, code: string, options: { encoding: "utf8" }): void;
  };
  globals: {
    get(name: "dict"): () => { destroy(): void };
  };
  runPythonAsync(
    code: string,
    options: { globals: { destroy(): void } },
  ): Promise<unknown>;
};

type PyodideModule = {
  loadPyodide(options: { indexURL: string }): Promise<Pyodide>;
};

const workerScope = self as DedicatedWorkerGlobalScope;

function postMessage(message: PythonWorkerResponse) {
  workerScope.postMessage(message);
}

function removeTree(pyodide: Pyodide, path: string) {
  if (!pyodide.FS.analyzePath(path).exists) return;
  for (const name of pyodide.FS.readdir(path)) {
    if (name === "." || name === "..") continue;
    const childPath = `${path}/${name}`;
    if (pyodide.FS.isDir(pyodide.FS.stat(childPath).mode)) {
      removeTree(pyodide, childPath);
    } else {
      pyodide.FS.unlink(childPath);
    }
  }
  pyodide.FS.rmdir(path);
}

function workspacePath(path: string): string {
  return `${WORKSPACE_ROOT}${path}`;
}

const PYTHON_HARNESS = String.raw`
import ast
import importlib
import io
import json
import os
import sys
import traceback

_result = {"passed": False, "tests": [], "diagnostics": []}
_workspace_root = ${JSON.stringify(WORKSPACE_ROOT)}
_entry_file = __entry_file
_test_files = list(__test_files.to_py())
_all_files = list(__all_files.to_py())

for _path in _all_files:
    if not _path.endswith(".py"):
        continue
    try:
        with open(_workspace_root + _path, "r", encoding="utf-8") as _source_file:
            compile(_source_file.read(), _path, "exec")
    except SyntaxError as _error:
        _result["diagnostics"].append({
            "file": _path,
            "line": _error.lineno,
            "message": _error.msg,
        })

if not _result["diagnostics"]:
    _previous_cwd = os.getcwd()
    os.chdir(_workspace_root)
    sys.path.insert(0, _workspace_root)
    _stdout = io.StringIO()
    _previous_stdout = sys.stdout
    sys.stdout = _stdout
    for _path in _all_files:
        if _path.endswith(".py"):
            _module_name = _path.lstrip("/")[:-3].replace("/", ".")
            sys.modules.pop(_module_name, None)

    try:
        _entry_module_name = _entry_file.lstrip("/")[:-3].replace("/", ".")
        importlib.import_module(_entry_module_name)
        for _test_path in _test_files:
            with open(_workspace_root + _test_path, "r", encoding="utf-8") as _test_file:
                _source = _test_file.read()
            _tree = ast.parse(_source, _test_path)
            _namespace = {"__name__": "__practice_test__", "__file__": _test_path}
            _function_names = []
            _top_level_index = 0

            for _node in _tree.body:
                if isinstance(_node, (ast.FunctionDef, ast.AsyncFunctionDef)) and _node.name.startswith("test_"):
                    exec(compile(ast.Module(body=[_node], type_ignores=[]), _test_path, "exec"), _namespace)
                    _function_names.append(_node.name)
                    continue

                if isinstance(_node, ast.Assert):
                    _top_level_index += 1
                    _name = ast.unparse(_node.test) if hasattr(ast, "unparse") else f"assert {_top_level_index}"
                    try:
                        exec(compile(ast.Module(body=[_node], type_ignores=[]), _test_path, "exec"), _namespace)
                        _result["tests"].append({"name": _name, "status": "pass"})
                    except Exception as _error:
                        _result["tests"].append({
                            "name": _name,
                            "status": "fail",
                            "message": "".join(traceback.format_exception(type(_error), _error, _error.__traceback__)).strip(),
                        })
                    continue

                exec(compile(ast.Module(body=[_node], type_ignores=[]), _test_path, "exec"), _namespace)

            for _name in _function_names:
                try:
                    _namespace[_name]()
                    _result["tests"].append({"name": _name, "status": "pass"})
                except Exception as _error:
                    _result["tests"].append({
                        "name": _name,
                        "status": "fail",
                        "message": "".join(traceback.format_exception(type(_error), _error, _error.__traceback__)).strip(),
                    })
    except Exception as _error:
        _result["runtimeError"] = "".join(traceback.format_exception(type(_error), _error, _error.__traceback__)).strip()
    finally:
        sys.stdout = _previous_stdout
        _captured_stdout = _stdout.getvalue()
        if _captured_stdout:
            _result["stdout"] = _captured_stdout
        if sys.path and sys.path[0] == _workspace_root:
            sys.path.pop(0)
        os.chdir(_previous_cwd)

_result["passed"] = (
    not _result["diagnostics"]
    and not _result.get("runtimeError")
    and bool(_result["tests"])
    and all(_test["status"] == "pass" for _test in _result["tests"])
)
json.dumps(_result, ensure_ascii=False)
`;

async function loadRuntime(): Promise<Pyodide> {
  const moduleUrl = `${PYODIDE_BASE_URL}pyodide.mjs`;
  const pyodideModule = (await import(
    /* webpackIgnore: true */ moduleUrl
  )) as PyodideModule;
  return pyodideModule.loadPyodide({ indexURL: PYODIDE_BASE_URL });
}

const pyodidePromise = loadRuntime();

pyodidePromise.then(
  () => postMessage({ type: "ready" }),
  (error) =>
    postMessage({
      type: "initialization-error",
      message: error instanceof Error ? error.message : String(error),
    }),
);

workerScope.onmessage = async (event: MessageEvent<PythonWorkerRequest>) => {
  const message = event.data;
  if (message.type !== "run") return;

  try {
    const pyodide = await pyodidePromise;
    removeTree(pyodide, WORKSPACE_ROOT);
    pyodide.FS.mkdirTree(WORKSPACE_ROOT);

    for (const file of message.files) {
      const fullPath = workspacePath(file.path);
      const directory = fullPath.slice(0, fullPath.lastIndexOf("/"));
      pyodide.FS.mkdirTree(directory);
      pyodide.FS.writeFile(fullPath, file.code, { encoding: "utf8" });
    }

    const namespace = pyodide.globals.get("dict")();
    try {
      const settableNamespace = namespace as unknown as {
        set(key: string, value: unknown): void;
      };
      settableNamespace.set("__entry_file", message.entryFile);
      settableNamespace.set(
        "__test_files",
        message.files
          .filter((file) => file.role === "test")
          .map((file) => file.path),
      );
      settableNamespace.set(
        "__all_files",
        message.files.map((file) => file.path),
      );
      const serialized = await pyodide.runPythonAsync(PYTHON_HARNESS, {
        globals: namespace,
      });
      postMessage({
        type: "result",
        id: message.id,
        result: JSON.parse(String(serialized)),
      });
    } finally {
      namespace.destroy();
    }
  } catch (error) {
    postMessage({
      type: "result",
      id: message.id,
      result: {
        passed: false,
        tests: [],
        diagnostics: [],
        runtimeError: error instanceof Error ? error.message : String(error),
      },
    });
  }
};
