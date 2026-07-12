# Tasks: skill-tree-data

## 1. Schema 與 migration

- [x] 1.1 Drizzle schema：`unit`、`lesson`（型態 enum + 考點/rubric jsonb）、`lesson_dependency`、`user_lesson_mastery`（含 FK 與 unique 約束）
- [x] 1.2 generate + migrate，驗證四張表與約束在 Neon 上生效

## 2. 課綱資料與 seed

- [x] 2.1 建立 `src/db/curriculum/react-junior-mid.ts`：React Junior → Mid 骨架（2 Unit、約 12 節點、依賴關係），考點與 rubric 由作者人工撰寫填入
- [x] 2.2 seed script：以 slug upsert（冪等），含循環依賴檢查（有循環即 fail 並指出位置）
- [x] 2.3 對 Neon 跑 seed，驗證重跑不重複

## 3. 查詢 API

- [x] 3.1 `GET /api/skill-tree`：登入保護，回傳 Unit → Lesson 樹（含依賴列表與當前使用者掌握度）
- [x] 3.2 驗證：登入請求回完整樹、未登入回 401

## 4. 驗收

- [x] 4.1 部署後在 production 以 demo 帳號呼叫 API，確認回傳完整技能樹
