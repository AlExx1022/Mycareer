## 1. Curriculum authoring

- [ ] 1.1 建立 `typescript-frontend-core.ts`，依 design 定義 3 Units、15 concept、3 practice 與完整同 path dependencies
- [ ] 1.2 為 15 個 concept 人工撰寫 intro、2–3 個遞進 examPoints 與至少兩條 rubric，逐課標明 compile-time / runtime 邊界
- [ ] 1.3 為 Unsafe Any Clinic、Async State Machine、Typed Data Page 撰寫人工 blueprint；前兩題 runtime `vanilla-ts`，capstone override 為 `react-ts`
- [ ] 1.4 人工交叉審查 JavaScript / React 課綱，刪除重教 runtime semantics、hooks 行為與進階型別體操的內容

## 2. TypeScript compile gate 課綱驗證

- [ ] 2.1 以 foundation 的 vanilla-ts / react-ts compile diagnostics 建立正式課程 fixtures，確認 diagnostics 與 runtime tests 分開呈現
- [ ] 2.2 為三個 practice 補 runtime 過但 typecheck 失敗的 case，驗證既有 compile gate 會阻擋送審
- [ ] 2.3 在三份 blueprint / rubric 明定禁止 unchecked any / assertion，並要求 AI review 驗證 runtime boundary

## 3. Seed 與課程驗證

- [ ] 3.1 將 TypeScript path 以 draft 加入 curricula aggregate，recommended prerequisite 設為 `javascript-interview-core`
- [ ] 3.2 selfcheck 精確驗證 3 / 18 / 15 / 3 數量、strict 設定、slug、DAG、intro / rubric / blueprint 完整
- [ ] 3.3 seed 兩次驗證冪等與其他 paths 資料隔離
- [ ] 3.4 抽測 erasure、unknown、discriminated union、generics、React boundary 五個 concept 的 prompt 與判定
- [ ] 3.5 完整跑三個 practice，確認 compile + runtime + AI review 雙軌與 autosave / resume

## 4. 收尾

- [ ] 4.1 更新 readme / landing 衍生統計與 TypeScript 路徑說明
- [ ] 4.2 跑 TypeScript、eslint、selfchecks、integration tests 與 production build
- [ ] 4.3 使用者走完 Async State Unit 並檢查是否能口述型別保證與 runtime 限制；修正後將 path 改為 published，才開始 Python curriculum change
