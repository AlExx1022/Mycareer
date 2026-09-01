# multi-path-learning-foundation 設計

## Context

目前 `unit` 沒有上層路徑，`getSkillTreeForUser` 會讀出全部 Unit；若直接加入三份課綱，所有節點會落在同一張直立地圖。另一方面，`graph.ts`、`units.ts`、`review-session.ts` 與 practice LLM prompt 都寫死 React／TypeScript，practice UI 也固定 Sandpack `react-ts` 與 `.tsx`。

既有 React 課綱有 24 個 lesson，lesson slug 同時是 mastery、weakness、lesson session、practice session 與 review session 的 FK。遷移不得更換這些 slug，也不得以全域 prune 誤刪既有進度。

## Goals / Non-Goals

**Goals:**

- 支援多條彼此獨立的學習路徑，使用者先選路徑再看該路徑技能樹。
- 讓概念教學、出題、複習與 code review 使用正確的主題與程式語言。
- 讓 JavaScript、TypeScript、React 與 Python 實作都能在瀏覽器執行，不把任意程式碼送到 application server 執行。
- 無損遷移既有 React curriculum 與所有以 lesson slug 關聯的使用者資料。
- 為後續人工策展課綱提供一致的 curriculum contract 與驗證器。

**Non-Goals:**

- 本 change 不撰寫三種新語言的正式課綱。
- 不新增跨路徑 hard dependency、全站排名、證書或 streak。
- 不建立通用遠端 code sandbox，不支援任意 package / OS / network 能力。
- 不在本 change 增加 placement test 或正式 interview mode。
- 不改 mastery decay、weakness、LLM 限額與 concept / practice 雙型態模型。

## Decisions

### D1：新增正式 Path entity，不以 Unit 命名慣例模擬路徑

新增 `learning_path`：

```text
learning_path
  id                 text PK
  title              text NOT NULL
  description        text NOT NULL
  subject            text NOT NULL
  code_language      text NOT NULL
  status             text NOT NULL CHECK (status IN ('draft', 'published'))
  position           integer NOT NULL

learning_path_recommendation
  path_id                       text FK → learning_path.id
  recommended_path_id           text FK → learning_path.id
  PRIMARY KEY (path_id, recommended_path_id)

unit
  path_id            text NOT NULL FK → learning_path.id
```

`subject` 是教學領域（JavaScript / TypeScript / React / Python），`codeLanguage` 是概念題程式碼 fence 與 prompt 使用的語言。兩者分開，因為 React 的 subject 是 React、範例語言仍是 TypeScript。新課綱先以 `draft` seed，完成內容與瀏覽器驗收後才把 curriculum metadata 改為 `published`；一般使用者的目錄與 path route 不暴露 draft。

替代方案「所有 Unit 繼續放同一張圖」被否決：近百節點會讓導航與進度摘要失去意義。替代方案「只在 curriculum 檔分組、不落 DB」也被否決：query、route、進度統計與 lesson prompt 都需要穩定 path identity。

### D2：practice runtime 放在 Lesson，path 只提供 authoring default

`lesson.practiceRuntime` 僅允許 `react-ts | vanilla-ts | vanilla-js | python | null`；concept 必須為 null，practice 必須有 runtime。curriculum path 可提供預設值，但 seed 前展開成 lesson 的明確值。

runtime 放 lesson 而不是只放 path，讓未來同一路徑可同時包含純函式練習與 UI 練習。值用應用層 union + seed selfcheck 驗證；DB 以 check constraint 限制已知值。

### D3：以 path-scoped route 與 query 隔離地圖

- `/tree`：路徑目錄，顯示標題、說明、完成數／總數與「繼續學習」。
- `/tree/[pathId]`：只查詢並呈現該 published path 的 Unit / Lesson。
- lesson route 維持 `/lesson/[slug]`，由 lesson → unit → path 取得返回連結與 prompt context。
- skill-tree API 要求 `path` query parameter；未知或 draft path 回 404，未登入回 401。

lesson slug 全域唯一，因此不需要把 path 加進 lesson URL，也不需遷移 session FK。

### D4：路徑之間不設 hard dependency

`lesson_dependency` 只允許同一路徑依賴，seed selfcheck 在寫 DB 前驗證。JavaScript → TypeScript → React 以 path metadata 的 `recommendedPrerequisitePathIds` 顯示建議，不影響節點解鎖。

這避免已有 React 經驗的使用者因新增 JavaScript 路徑而突然被鎖住，也避免 path A 的課綱調整級聯破壞 path B。

### D5：LLM context 由單一 LessonContext 建立

查詢層提供：

```ts
type LessonContext = {
  lessonId: string;
  title: string;
  subject: string;
  codeLanguage: string;
  pathId: string;
  pathTitle: string;
  examPoints: string[];
  rubric: RubricItem[];
  practiceRuntime: PracticeRuntime | null;
  practiceBlueprint: PracticeBlueprint | null;
};
```

lesson teaching、unit question、review question、practice generation 與 code review 全部接收同一 context，禁止各模組自行推測語言。共用 question rules 以參數插入 code fence 語言，不保留「React 技能樹」「一律 TypeScript」等常數。

### D6：人工 blueprint 固定面試練習意圖

practice lesson 新增：

```ts
type PracticeBlueprint = {
  objective: string;
  requirements: string[];
  edgeCases: string[];
  starterSignature?: string;
  timeboxMinutes: number;
  followUps: string[];
};
```

LLM 可變換敘事情境與測資，但題目不得偏離 objective / requirements / edgeCases；code review 也依同一 blueprint 判定。既有 React practice 在 migration 後補齊 blueprint，沒有 blueprint 的舊 session 仍可還原；重新出題前才要求新版資料完整。

替代方案「所有 starter code 與 tests 完全固定」被否決：會失去現有動態出題特色；完全交給 LLM 的現況則無法保證面試題型與邊界覆蓋。

### D7：versioned workspace 與 runner adapter 統一執行結果

practice session 的 JSONB exercise 升級為 versioned multi-file workspace，支援 ESM 練習、React component / tests 與 Python package / tests，不再假設只有 `/exercise.tsx` 和 `/exercise.test.tsx`：

```ts
type PracticeWorkspace = {
  version: 2;
  description: string;
  entryFile: string;
  files: Array<{
    path: string;
    code: string;
    role: "starter" | "test" | "setup";
    readOnly: boolean;
  }>;
};
```

API 讀到既有 v1 `{ description, starterCode, testCode }` 時，以 `react-ts` adapter 映射成 v2 workspace；不強制重出題、不清除 userCode。新生成題一律存 v2。

`practice_session` additive 新增 `user_files` JSONB，保存所有可編輯檔案的最新內容。舊 row 的 `user_files` 為 null 時，把 `user_code` 映射到 entry file；新版 autosave 寫 `user_files`，但本 change 不刪除 `user_code`，待資料穩定後另行移除。

runner 的最小 contract：

```ts
type PracticeRunnerResult = {
  passed: boolean;
  tests: { name: string; status: "pass" | "fail"; message?: string }[];
  diagnostics: { file: string; line?: number; message: string }[];
  runtimeError?: string;
};
```

- `react-ts`：Sandpack `react-ts`、`.tsx`，保留 Testing Library setup。
- `vanilla-ts`：Sandpack `vanilla-ts`、`.ts`。
- `vanilla-js`：Sandpack `vanilla`、`.js`。
- `python`：Pyodide lazy-load 到 module Web Worker，把 workspace 檔案寫入虛擬 filesystem，在獨立 namespace 執行 entry 與 assertion-based tests。

TypeScript diagnostics 非空或 tests 未全過時 `passed` 必須為 false。Python worker 每次 run 設定時間上限；超時即 terminate 並重建 worker。Pyodide 只在 Python practice route 動態載入，不進入其他路徑 bundle。Python 在瀏覽器沙箱中執行，application server 永不 eval 使用者碼。

### D8：seed 以多課綱 aggregate 為入口、按 path 同步

每條 curriculum 獨立檔案，export `CurriculumPath`；aggregate 是 production seed 的唯一入口。同步順序為 path → units → lessons → dependencies，stale prune 限定目前 path。未包含在本次 sync 的其他 path 不得刪除。

既有 React migration：先建立 `react-junior-mid` path，再 backfill 兩個 unit 的 `path_id`，最後設 NOT NULL。lesson id 不變，所以 mastery / weakness / session 不需搬移。rollback 只在尚未加入第二條 path 時允許移除 `path_id` 與 `learning_path`；已有多路徑資料時只回滾 application，不做 destructive schema rollback。

### D9：下一站與完成度都限制在目前 path

next-lesson query 從目前 lesson 取得 path，只在同 path 中拓撲搜尋。路徑目錄的完成度採 raw mastery ≥ 70 計數，裂開節點仍算「曾完成」，裂開狀態由原有複習佇列處理。

## Risks / Trade-offs

- [Pyodide 首次下載較大] → 僅 Python practice lazy-load，顯示獨立初始化狀態並快取 worker；概念課與其他路徑不下載。
- [使用者 Python 無限迴圈凍結 runner] → worker timeout 後 terminate，不在 main thread 或 server 執行。
- [active changes 同時修改 `/tree`] → 實作前完成或 rebase `landing-page`、`visual-polish`，foundation 驗收以其最終路由為基準。
- [seed prune 誤刪別條路徑] → prune query 必須帶 path scope，selfcheck 建立兩條 fixture 後只重種其中一條驗證隔離。
- [prompt 泛化後 React 教學品質下降] → 用既有 React 節點做 regression fixture，比對 subject、code language、question count 與 review contract。
- [runtime union 未來擴充需 migration] → DB check constraint 與 TS union 明確換取錯誤早發現；新增 runtime 時以 additive change 更新。

## Migration Plan

1. 完成或 rebase 目前修改 `/tree` 的 active changes。
2. 建立 additive schema：`learning_path`、nullable `unit.path_id`、nullable practice 欄位。
3. insert React path 並 backfill 現有 units；驗證沒有 null 後設 `path_id` NOT NULL 與 FK/index。
4. 部署支援 v1 → v2 workspace、`user_code` → `user_files` 映射的新舊 practice session application code。
5. 切換 curriculum aggregate、path-scoped query 與 routes，重跑 seed；驗證 lesson/mastery/session 數量不變。
6. 啟用 vanilla 與 Python dev fixtures，完成 runner/browser tests 後才允許後續 curriculum changes。

## Open Questions

- Pyodide CDN 版本採 self-host 或 pin jsDelivr，實作前以 Vercel bundle、CSP 與冷啟載入量量測決定；無論選項都必須 pin 版本，不使用 `latest`。
