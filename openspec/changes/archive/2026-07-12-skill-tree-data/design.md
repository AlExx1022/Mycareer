# Design: skill-tree-data

## Context

C0 已有 Next.js + Drizzle + Neon + Better Auth 的骨架。本 change 加入技能樹的資料層：schema、第一條策展路徑的 seed、與查詢 API。C2（UI）與 C3（session 引擎）都以此為介面，schema 設計需主題無關且預留 C5 的衰減欄位。

## Goals / Non-Goals

**Goals:**

- 主題無關的技能樹 schema：Unit / Lesson、節點型態、依賴關係、使用者掌握度。
- React Junior → Mid 路徑（2 Unit、約 12 節點）進 DB，含考點與 rubric。
- 一支 API 回傳完整樹狀結構 + 當前使用者掌握度。

**Non-Goals:**

- 技能樹 UI（C2）、學習 session（C3）、衰減公式與裂開門檻（C5）。
- 課綱編輯後台——課綱以程式碼中的資料檔維護即可。
- 多路徑 / 多課綱管理——schema 不阻擋，但只 seed 一條。

## Decisions

1. **四張表：`unit`、`lesson`、`lesson_dependency`、`user_lesson_mastery`**
   - 依賴用 join table（adjacency list），可直接 SQL 查詢與檢查循環；不用 jsonb 陣列（無法用 FK 保證指向存在的節點）。
   - 掌握度獨立成 user × lesson 表，存 `score`（0–100 int）與 `assessed_at`。節點三態（亮/裂/鎖）是衍生狀態，由讀取端計算，不落庫——C5 的衰減只需讀 `assessed_at`，不用改 schema。

2. **考點與 rubric 是 `lesson` 上的 jsonb 欄位**（`exam_points: string[]`、`rubric: {criterion, pass_condition}[]`）
   - 只有 C3 檢核引擎讀它，不需要獨立表。結構化成 jsonb 而非純文字，讓 C3 能逐條檢核。

3. **節點型態用 text enum：`concept` | `practice`**
   - 對應 C3（概念型）與 C4（實作型）。Drizzle `text({ enum })` + DB check constraint。

4. **課綱內容放 `src/db/curriculum/react-junior-mid.ts`，seed script 讀它 upsert**
   - 型別安全、diff 可讀、作者直接編輯 TS 檔。seed 以 slug 為 key upsert，重跑冪等。
   - 課綱文字（考點、rubric）由作者人工撰寫；本 change 實作時先放結構完整的骨架（正確的 Unit / 節點切分與依賴），文字內容由作者填入或修訂。

5. **API 用單一 route handler `GET /api/skill-tree`**
   - 回傳 `{ units: [{ ..., lessons: [{ ..., dependsOn: string[], mastery: {...} | null }] }] }`。
   - 一次撈全樹（~12 節點，無分頁需求），登入保護沿用既有 middleware 模式。

## Risks / Trade-offs

- [課綱是 seed 資料，改課綱要重 seed] → upsert 冪等 + slug 穩定，改內容重跑 seed 即可；節點刪除罕見，手動處理。
- [rubric jsonb 無 DB 級 schema 驗證] → seed 端用 TS 型別把關，進 DB 前已保證結構。
- [循環依賴會讓 C2 排版與 C3 解鎖邏輯壞掉] → seed script 內做拓撲排序檢查，有循環直接 fail。

## Open Questions

- 無——衰減公式明確延後到 C5 定案。
