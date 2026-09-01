import type { PracticeRunnerResult } from "./runner";

export type PythonWorkerFile = {
  path: string;
  code: string;
  role: "starter" | "test" | "setup";
};

export type PythonWorkerRunMessage = {
  type: "run";
  id: number;
  entryFile: string;
  files: PythonWorkerFile[];
};

export type PythonWorkerRequest = PythonWorkerRunMessage;

export type PythonWorkerResponse =
  | { type: "ready" }
  | { type: "initialization-error"; message: string }
  | {
      type: "result";
      id: number;
      result: PracticeRunnerResult;
    };

