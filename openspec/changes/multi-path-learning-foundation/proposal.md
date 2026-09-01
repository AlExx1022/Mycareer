# multi-path-learning-foundation

## Why

系統目前雖以主題無關的 Unit / Lesson schema 儲存資料，但產品行為仍假設只有一條 React 路徑：`/tree` 一次載入全部 Unit、LLM prompt 固定自稱 React 導師、程式碼範例固定 TypeScript、實作編輯器固定 `react-ts`。直接加入 JavaScript、TypeScript 與 Python 課綱，會得到一張過長的混合技能樹，Python 實作也無法執行。

在引入新課程前，需要先把「路徑、教學語言、實作 runtime」升格為正式資料與介面，同時無損遷移既有 React 課綱與使用者進度。

## What Changes

- 新增 Learning Path 層級，資料結構由 Unit → Lesson 改為 Path → Unit → Lesson；既有 React 課綱遷移為 `react-junior-mid` 路徑。
- `/tree` 改為學習路徑目錄，新增 `/tree/[pathId]` 顯示單一路徑技能樹；地圖不再一次渲染所有課程。
- 課綱 metadata 明確保存 `subject`、`codeLanguage` 與實作節點 `practiceRuntime`，LLM 教學、出題、複習與 code review 依 metadata 組 prompt，不再寫死 React／TypeScript。
- 實作 session 升級為可保存多檔案的 versioned workspace，介面改為 runtime adapter：支援 `react-ts`、`vanilla-ts`、`vanilla-js` 與 `python`；Python 以 Pyodide Web Worker 在瀏覽器執行並設 timeout。
- 實作節點新增人工策展的 `practiceBlueprint`，固定目標、需求、邊界條件與時限；LLM 只依 blueprint 產生題目變體與測試。
- seed 改為多課綱聚合與按路徑同步，新增或重種一條路徑不得刪除其他路徑；禁止跨路徑 hard dependency。
- 下一站推薦限制在目前路徑；跨路徑只顯示建議前置，不作為解鎖條件。
- **BREAKING（API / route）**：技能樹查詢改為 path-scoped，技能樹頁由 `/tree` 移至 `/tree/[pathId]`；既有 lesson slug 與進度資料不變。
- 不加入任何 JavaScript、TypeScript 或 Python 正式課程；本 change 只交付可承載它們的平台能力與 dev fixtures。

## Capabilities

### New Capabilities

- `learning-paths`: 學習路徑資料、目錄、路徑進度摘要與 path-scoped 導覽。

### Modified Capabilities

- `skill-tree-data`: 資料層加入 Path，seed 與查詢改為多路徑且隔離同步。
- `skill-tree-ui`: `/tree` 改為路徑目錄，單一路徑地圖移至 `/tree/[pathId]`。
- `lesson-session`: 教學、互動題與複習 prompt 改由課程 metadata 決定主題與程式語言。
- `practice-session`: 實作題改為 blueprint 驅動並由 runtime adapter 在瀏覽器執行。

## Impact

- **DB**：新增 `learning_path` 與建議前置關聯；`unit` 新增非空 `path_id`；`lesson` 新增 nullable `practice_runtime` 與 `practice_blueprint`；`practice_session` 新增 nullable `user_files` JSONB。需要 additive migration 與 React 資料 backfill；舊 `user_code` 與 exercise payload 維持可讀。
- **課綱 / seed**：新增共用 curriculum 型別與 aggregate；既有 `react-junior-mid.ts` 僅包入 path metadata，不更換 unit / lesson slug。
- **查詢 / routing**：調整 skill-tree query、API、`/tree`、新增 `/tree/[pathId]`；課程頁返回目前路徑。
- **LLM**：調整 lesson、unit questions、review questions、practice generation 與 code review prompt；呼叫次數與每日限額規則不變。
- **前端 runtime**：Sandpack 依 runtime 選 template；新增只在 Python 實作頁 lazy-load 的 Pyodide worker。
- **既有 active changes**：實作前先完成或 rebase `landing-page` 與 `visual-polish`，避免同時修改 `/tree`、sidebar 與課綱統計。
