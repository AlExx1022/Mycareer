import type { PracticeDiagnostic } from "./runner";

type CheckResponse = {
  id: number;
  diagnostics: PracticeDiagnostic[];
};

export class TypeScriptCheckClient {
  private readonly worker = new Worker(
    new URL("./typescript-check.worker.ts", import.meta.url),
    { type: "module" },
  );
  private nextId = 0;
  private readonly pending = new Map<
    number,
    (diagnostics: PracticeDiagnostic[]) => void
  >();

  constructor() {
    this.worker.onmessage = (event: MessageEvent<CheckResponse>) => {
      const resolve = this.pending.get(event.data.id);
      if (!resolve) return;
      this.pending.delete(event.data.id);
      resolve(event.data.diagnostics);
    };
    this.worker.onerror = (event) => {
      const diagnostics: PracticeDiagnostic[] = [
        {
          file: "TypeScript",
          message: `型別檢查器執行失敗：${event.message || "未知錯誤"}`,
        },
      ];
      for (const resolve of this.pending.values()) resolve(diagnostics);
      this.pending.clear();
    };
  }

  check(
    files: Record<string, string>,
    react: boolean,
  ): Promise<PracticeDiagnostic[]> {
    const id = ++this.nextId;
    this.worker.postMessage({ id, files, react });
    return new Promise((resolve) => this.pending.set(id, resolve));
  }

  terminate() {
    this.worker.terminate();
    this.pending.clear();
  }
}
