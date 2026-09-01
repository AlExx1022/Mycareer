import type { PracticeRunnerResult } from "./runner";
import type {
  PythonWorkerRequest,
  PythonWorkerResponse,
} from "./python-protocol";
import type { PracticeWorkspace } from "./workspace";

export const PYTHON_RUN_TIMEOUT_MS = 5_000;
export const PYODIDE_INITIALIZATION_TIMEOUT_MS = 60_000;

export type WorkerLike = {
  onmessage: ((event: MessageEvent<PythonWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: PythonWorkerRequest): void;
  terminate(): void;
};

type WorkerFactory = () => WorkerLike;

function createPyodideWorker(): WorkerLike {
  return new Worker(new URL("./pyodide.worker.ts", import.meta.url), {
    type: "module",
  });
}

function failedResult(message: string): PracticeRunnerResult {
  return {
    passed: false,
    tests: [],
    diagnostics: [],
    runtimeError: message,
  };
}

export class PyodidePracticeRunner {
  private worker: WorkerLike | null = null;
  private readyPromise: Promise<WorkerLike> | null = null;
  private requestId = 0;
  private running = false;

  constructor(
    private readonly workerFactory: WorkerFactory = createPyodideWorker,
    private readonly runTimeoutMs = PYTHON_RUN_TIMEOUT_MS,
    private readonly initializationTimeoutMs = PYODIDE_INITIALIZATION_TIMEOUT_MS,
  ) {}

  private resetWorker() {
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
    this.running = false;
  }

  private ensureReady(): Promise<WorkerLike> {
    if (this.readyPromise) return this.readyPromise;

    const worker = this.workerFactory();
    this.worker = worker;
    this.readyPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.resetWorker();
        reject(new Error("Python 執行環境初始化逾時，請再試一次"));
      }, this.initializationTimeoutMs);

      worker.onmessage = (event) => {
        if (event.data.type === "ready") {
          clearTimeout(timeout);
          resolve(worker);
        } else if (event.data.type === "initialization-error") {
          clearTimeout(timeout);
          this.resetWorker();
          reject(new Error(`Python 執行環境初始化失敗：${event.data.message}`));
        }
      };
      worker.onerror = (event) => {
        clearTimeout(timeout);
        this.resetWorker();
        reject(new Error(event.message || "Python worker 初始化失敗"));
      };
    });
    return this.readyPromise;
  }

  async run(workspace: PracticeWorkspace): Promise<PracticeRunnerResult> {
    if (this.running) return failedResult("Python 測試仍在執行中");

    let worker: WorkerLike;
    try {
      worker = await this.ensureReady();
    } catch (error) {
      return failedResult(error instanceof Error ? error.message : String(error));
    }

    this.running = true;
    const id = ++this.requestId;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.resetWorker();
        resolve(failedResult(`Python 程式執行超過 ${this.runTimeoutMs}ms，已終止並重建執行環境`));
      }, this.runTimeoutMs);

      worker.onmessage = (event) => {
        if (event.data.type !== "result" || event.data.id !== id) return;
        clearTimeout(timeout);
        this.running = false;
        resolve(event.data.result);
      };
      worker.onerror = (event) => {
        clearTimeout(timeout);
        this.resetWorker();
        resolve(failedResult(event.message || "Python worker 執行失敗"));
      };

      worker.postMessage({
        type: "run",
        id,
        entryFile: workspace.entryFile,
        files: workspace.files.map(({ path, code, role }) => ({
          path,
          code,
          role,
        })),
      });
    });
  }

  dispose() {
    this.resetWorker();
  }
}

