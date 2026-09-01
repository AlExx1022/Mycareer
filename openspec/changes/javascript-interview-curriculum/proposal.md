# javascript-interview-curriculum

## Why

現有 React 路徑直接從 JSX 開始，沒有驗收 JavaScript 的 runtime、scope、closure、`this`、Promise、event loop、DOM 與 fetch；這些既是理解 React bug 的前置，也是 Junior Frontend 面試會直接追問的語言與瀏覽器基礎。

本 change 在多路徑平台完成後，新增一條刻意縮限的 JavaScript Junior 面試核心路徑，不把完整 ECMAScript roadmap 或進階演算法百科搬進產品。

## What Changes

- 新增 `javascript-interview-core` 路徑：5 Unit、28 Lesson（23 concept、5 practice）。
- 課程順序為「值與比較 → Scope / Function / this → Collections / Object Model → Async → Browser Integration」。
- concept rubric 同時驗收口頭解釋與讀碼／debug 推理，不接受只背定義。
- practice 由人工 blueprint 鎖定五類面試 archetype：輸出推理、closure / this debug、資料轉換、Promise concurrency、autocomplete capstone。
- JavaScript 路徑列為 TypeScript 與 React 的建議前置，但不建立跨路徑 hard dependency。
- 更新 curriculum aggregate、seed selfcheck、路徑統計、readme 與 landing 衍生資料。
- 不做：Proxy / Reflect、WeakRef、TypedArray、手寫 Promise/A+、JIT / GC internals、完整 DSA、舊式 module systems。

## Capabilities

### New Capabilities

- `javascript-interview-curriculum`: JavaScript Junior Frontend 面試核心路徑、內容邊界與過關標準。

### Modified Capabilities

（無；依賴 `multi-path-learning-foundation` 提供的既有多路徑能力。）

## Impact

- **前置 change**：`multi-path-learning-foundation` 必須完成並通過四 runtime fixtures。
- **課綱**：新增 `src/db/curriculum/javascript-interview-core.ts` 並加入 curricula aggregate。
- **DB**：無新 schema；重跑 path-scoped seed 只新增 JavaScript path / units / lessons / dependencies。
- **LLM 成本**：新增課程被使用時才產生教學題目與 review；每日限額規則不變。
- **UI / docs**：路徑目錄新增 JavaScript 卡片；landing / readme 統計自 aggregate 更新。

