## Context

C3 已完成概念型節點的對話學習循環：LangGraph 狀態機（`src/lib/lesson-session/graph.ts`）、session 落 DB、llm_usage 限額、weakness_record 弱點表、掌握度 server 端寫入（score 100 ≥ MASTERY_THRESHOLD 70 亮燈）。課程頁 `src/app/lesson/[slug]/page.tsx` 目前所有節點都走對話 UI。本 change 為 `lesson.type = 'practice'` 節點補上實作流程，完成 Phase 1 里程碑。

## Goals / Non-Goals

**Goals:**

- 實作型節點：出題（題目 + 起始碼 + 測試）→ Sandpack 內寫碼跑測試 → 測試全過後 AI code review → 掌握度回寫亮燈 + 推薦下一節點。
- 題目與使用者程式碼落 DB，中斷可續作。
- review 發現的弱點寫入 weakness_record（C5 資料來源）。
- 出題與 review 納入 llm_usage 限額。

**Non-Goals:**

- 概念型節點流程改動（題型多樣化、小單元拆分 → C4.5）。
- 多題目輪換、難度分級——每節點一題，過關即亮燈。
- 伺服器端重跑測試（見 Risks）。

## Decisions

### D1: Sandpack 全包編輯器與瀏覽器內測試，不自建 runner

`@codesandbox/sandpack-react` 的 `SandpackProvider` + `SandpackCodeEditor` + `SandpackTests`，react-ts template。測試碼用 Vitest 風格（`SandpackTests` 原生支援），在使用者瀏覽器內執行，零伺服器運算成本。

- 替代方案「Monaco + 自建 test runner iframe」被否決：Sandpack 一個依賴就涵蓋編輯器、bundler、測試執行，自建是重複造輪子。

### D2: practice 流程不用 LangGraph，兩個 route handler 就夠

流程是「出題一次呼叫 → 使用者離線寫碼 → review 一次呼叫」，沒有多輪狀態轉移，硬套 StateGraph 是為工具找問題。LangGraph 作品集展示已由 C3/C5 承擔。

- `POST /api/lesson/[slug]/practice`：get-or-generate 題目（已有 session 直接回傳，否則 LLM 結構化輸出生成後落 DB）。
- `POST /api/lesson/[slug]/review`：收使用者程式碼 + 測試結果，跑 AI review，通過則寫掌握度。

兩者皆沿用 C3 的 auth 驗證與 llm_usage 限額檢查。

### D3: practice_session 自建表，比照 lesson_session 模式

`practice_session` 表：`(userId, lessonId)` PK、`exercise` jsonb（`description`、`starterCode`、`testCode`）、`userCode` text、`status`（`in_progress` / `passed`）、`updatedAt`。續作時還原題目與使用者上次程式碼。

### D4: 驗收雙軌，過關判定在 review route 內 server 端完成

client 回報「測試全過」只是進入 review 的門票；掌握度寫入條件是 server 端 AI review 的結構化輸出判定 `verdict: pass`。review prompt 附上題目、測試碼與使用者程式碼，要求 LLM 確認程式碼確實滿足測試意圖，再給品質意見（命名、慣用寫法、邊界情況）。

- review 結構化輸出：`verdict`（pass/fail）、`comments[]`（即時顯示）、`weaknesses[]`（criterion + summary，寫入 weakness_record，格式沿用 C3）。
- fail（如貼上與測試無關的程式碼騙過 client）→ 不寫掌握度，意見照樣顯示。

### D5: 出題用結構化輸出，一次生成三件套

出題呼叫以 lesson 的 examPoints + rubric 為範圍，結構化輸出 `description`（Markdown 題目說明）、`starterCode`（含 TODO 的起始碼）、`testCode`（Vitest 測試）。生成後即落 DB，同 session 不重生——省 LLM 成本也讓續作一致。

### D6: 課程頁依 type 分流，practice UI 左題右碼

`page.tsx` 讀 lesson.type：`concept` 維持現有對話元件，`practice` 渲染新的 `PracticeSession` client component——左側題目說明（Markdown）+ review 意見區，右側 Sandpack（editor 上、tests 下）。測試全過時亮出「送出 review」按鈕。

## Risks / Trade-offs

- [測試在 client 跑，結果可偽造] → D4 的 server 端 review 是實際過關判定；偽造測試結果最多騙到 review 這一步，騙不到掌握度。天花板：LLM review 不如真跑測試嚴謹——demo 定位可接受，需要更嚴時再上 server 端 sandbox 執行（Vercel Sandbox）。
- [LLM 生成的測試碼可能跑不起來（語法錯、import 錯）] → 出題 prompt 給固定的測試骨架與 import 白名單；仍失敗時 UI 提供「重新出題」（刪 session 重生，計一次限額）。
- [Sandpack bundler 依賴 CodeSandbox CDN] → 公開 demo 可接受；離線不可用是已知限制，不自建 bundler。
- [一次結構化輸出生成三件套，長輸出易截斷或格式漂移] → gemini-3-flash 輸出上限充足；用 AI SDK `generateObject` 的 zod schema 驗證，失敗自動重試一次。

## Open Questions

- 無。模型沿用 `google/gemini-3-flash`（成本政策），出題與 review 各計一次 llm_usage。
