## 1. 前置整合與資料 migration

- [x] 1.1 完成或 rebase 會修改 `/tree`、sidebar、landing 統計的 `landing-page` 與 `visual-polish` active changes，記錄 foundation 的基準 commit
- [x] 1.2 擴充 curriculum 型別：新增 `CurriculumPath`、subject、codeLanguage、draft / published status、recommendedPrerequisitePathIds、PracticeRuntime 與 PracticeBlueprint
- [x] 1.3 新增 `learning_path` 與 `learning_path_recommendation` schema；`unit.pathId`、`lesson.practiceRuntime`、`lesson.practiceBlueprint`、`practiceSession.userFiles` 先以 additive nullable 欄位建立
- [x] 1.4 產生並人工檢查 Drizzle migration：建立 `react-junior-mid`、backfill 現有 units、驗證無 null 後補 NOT NULL / FK / index / runtime check constraint
- [x] 1.5 migration 前後以 read-only 查詢核對 path / unit / lesson / mastery / weakness / session 筆數，確認 24 個既有 lesson slug 與關聯資料不變

## 2. 多路徑 curriculum 與 seed

- [x] 2.1 將既有 React curriculum 以 published status 包成 `CurriculumPath`，為四個 practice 補人工 blueprint / `react-ts` runtime，不變更 unit / lesson slug、考點、rubric 或依賴
- [x] 2.2 建立 curricula aggregate 與按 path 同步的 seed；stale unit / lesson prune 必須限制在目前 path
- [x] 2.3 擴充 seed selfcheck：全域 slug 唯一、同 path 依賴、acyclic、concept intro、practice runtime / blueprint、建議前置 path 存在
- [x] 2.4 補兩條最小 fixture，驗證只重種其一條不會刪除另一條及其 mastery / session

## 3. 路徑查詢與導覽

- [x] 3.1 新增 published path summary query：metadata、raw mastery 完成數與總數，不載入完整 lesson payload
- [x] 3.2 將 skill-tree query / API 改為 path-scoped，未知 / draft path 404、未登入 401，dependencies 只含同 path lesson
- [x] 3.3 `/tree` 改為路徑目錄；新增 `/tree/[pathId]` 並重用既有 `SkillTreeMap`
- [x] 3.4 lesson query 一次取得 path context；返回連結、metadata 與完成後 CTA 指向所屬 path
- [x] 3.5 next-lesson 限制在目前 path；path 完成時回傳完成狀態而非跨路徑 lesson
- [x] 3.6 更新 sidebar、登入後導向與 landing 衍生統計，使單一路徑與全站總數語意清楚

## 4. 多語言 lesson context

- [x] 4.1 建立共用 `LessonContext` query / type，供 concept、unit question、review 與 practice 流程使用
- [x] 4.2 泛化 `graph.ts`、chat route 與 unit question rules，移除固定 React／TypeScript 文案並依 subject / codeLanguage 產生 prompt
- [x] 4.3 泛化 weakness review prompt，確保複習沿用原 lesson 的 subject / codeLanguage
- [x] 4.4 以既有 React lesson 做 regression selfcheck，確認 migration 後教學主題、TypeScript 範例、題型與 session 續作不變

## 5. Practice runtime adapters

- [x] 5.1 將 PracticeExercise 升級為 versioned multi-file workspace；補既有 React v1 payload → v2 workspace、userCode → userFiles 映射與續作相容測試
- [x] 5.2 將 practice generation / review 改接收 LessonContext 與 PracticeBlueprint，依 codeLanguage 生成 entry / starter / test / setup files
- [x] 5.3 抽出含 compile diagnostics 的 `PracticeRunner` contract，以及共用 editor controls / autosave / normalized result UI
- [x] 5.4 實作 react-ts adapter，保留現有 Testing Library dependencies、TypeScript diagnostics 與既有 React practice regression tests
- [x] 5.5 實作 vanilla-ts 與 vanilla-js Sandpack adapters，依 runtime 選 template、workspace 檔案與測試 setup
- [x] 5.6 pin Pyodide 版本並實作 lazy-loaded module Web Worker、虛擬 filesystem、獨立 namespace、assertion test parser、timeout terminate / recreate
- [x] 5.7 新增 dev fixtures：四種 runtime 各一題，驗證多檔案編輯、autosave、diagnostics、逐條測試、送審與重新出題

## 6. 驗證與交付門檻

- [x] 6.1 跑 migration / seed selfchecks、TypeScript、eslint、既有 test 與 production build
- [x] 6.2 API integration 驗證：路徑摘要、path-scoped tree、404 / 401、同 path 下一站、其他 path 資料隔離
- [x] 6.3 Browser 驗收：`/tree` 選路徑、React 既有進度、四種 runtime、Python timeout 後可再次執行、手機無橫向溢出
- [x] 6.4 記錄 Pyodide 首次載入量與時間；若未達可接受門檻，依 design Open Question 決定 self-host 或 CDN 後再允許 Python curriculum change 開始
- [x] 6.5 更新 readme / roadmap 的資料模型、route、runtime 與後續 curriculum change 順序
