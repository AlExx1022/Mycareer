# python-interview-curriculum

## Why

履歷主打 Python，但目前 repository 沒有 Python 課綱、Python runner 或可驗收的 Python 工程實作。若只增加語法問答，面試時仍難以證明對 Python 特有物件語意、generator、模組、typing、測試與資料結構選擇的掌握。

本 change 在多 runtime 平台與前兩條語言路徑穩定後，新增「前端工程師第二專長」定位的 Python Junior 路徑，完成線是一個 typed、tested、可執行的資料處理 CLI，而不是擴張成 Backend 或 Data Science 全餐。

## What Changes

- 新增 `python-interview-core` 路徑：4 Unit、22 Lesson（17 concept、5 practice）。
- 課程順序為「Python 物件與資料 → 函式與惰性運算 → 模組／錯誤／型別／測試 → 物件設計與面試實作」。
- practice 使用 Pyodide runtime，固定涵蓋資料正規化、lazy pipeline、typed CLI、CLI refactor / tests、限時 coding lab。
- capstone 為「履歷與職缺技能差距分析 CLI」：讀 JSON / CSV、正規化與統計、輸出 Markdown，具 package layout、type hints 與 tests。
- 不做：Django / Flask / FastAPI、ORM / DB、`asyncio` / GIL、NumPy / Pandas / ML、metaclass / descriptor、進階 typing、複雜 DSA。
- Python path 與 JavaScript / TypeScript / React 無 hard dependency；已有程式經驗的使用者可直接開始。

## Capabilities

### New Capabilities

- `python-interview-curriculum`: Python Junior 面試與工程實作核心路徑、capstone 與範圍限制。

### Modified Capabilities

（無；依賴既有多路徑與 Python runtime 能力。）

## Impact

- **前置 changes**：`multi-path-learning-foundation`、`javascript-interview-curriculum`、`typescript-interview-curriculum`。
- **課綱**：新增 `src/db/curriculum/python-interview-core.ts` 並加入 aggregate。
- **DB**：無新 schema；path-scoped seed 新增 Python path / units / lessons / dependencies。
- **Runtime**：使用 foundation 已 pin 且驗收過的 Pyodide Web Worker；不得在 Next.js server 執行學生 Python。
- **文件 / UI**：新增 Python 路徑說明與 runtime loading / timeout 使用提示。

