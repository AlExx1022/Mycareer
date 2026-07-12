# Proposal: skill-tree-data

## Why

產品的核心是「課綱成為資料」——技能樹不是寫死的 UI，而是 DB 裡可查詢、有依賴關係、可記錄掌握度的結構。C0 骨架已上線，後續 C2（技能樹 UI）與 C3（學習 session）都直接消費這份資料，此 change 是 Phase 1 其餘工作的前置。

## What Changes

- 新增技能樹 Drizzle schema：Unit / Lesson（節點）、節點型態（概念型 / 實作型）、節點間依賴關係、使用者掌握度欄位。schema 主題無關，不綁 React。
- 人工策展第一條學習路徑「React Junior → Mid」：2 個 Unit、約 12 個節點，含每節點的考點與過關 rubric（作者人工撰寫，不由 LLM 生成；rubric 是後續 C3 檢核引擎的依據）。
- 新增 seed script 灌入策展好的技能樹資料。
- 新增 API：回傳含依賴關係的樹狀結構（含當前使用者的掌握度狀態）。

## Capabilities

### New Capabilities

- `skill-tree-data`: 技能樹資料模型（Unit / Lesson、節點型態、依賴關係、掌握度）、seed 資料、與樹狀結構查詢 API。

### Modified Capabilities

（無——不影響 auth 與 project-foundation 的既有需求。）

## Impact

- **DB**：新增 tables（unit、lesson、lesson 依賴、user 掌握度），一次 Drizzle migration。
- **程式碼**：`src/db/schema`、seed script、一個 API route（或 server function）。
- **資料**：課綱內容檔（考點 + rubric）由作者撰寫後進 seed；本 change 的實作工作包含 schema 與管線，課綱文字由作者提供。
- **相依**：無新套件需求（沿用 Drizzle + Neon）。
