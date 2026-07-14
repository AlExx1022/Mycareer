# practice-nodes-sandpack（C4）

## Why

技能樹上的實作型節點（`lesson.type = 'practice'`）目前點進去只能走概念型的對話流程，沒有寫程式的環節——但「動手寫、跑測試、被 review」才是實作型節點存在的意義，也是 Phase 1 里程碑（完整學習循環上線）的最後一塊。

## What Changes

- 課程頁依 `lesson.type` 分流：`practice` 節點改渲染實作題介面（左側題目說明、右側 Sandpack 編輯器），`concept` 節點維持現有對話 UI。
- 實作題出題：LLM 依節點考點產生題目說明、起始碼、測試碼（Vitest 風格），同一節點的題目在 session 內持久化，中斷可續作。
- 驗收雙軌：
  - 測試在瀏覽器內（Sandpack test runner）執行，全過為必要條件。
  - 測試通過後送 AI code review，針對程式碼品質（命名、慣用寫法、邊界情況）給即時意見；review 發現的弱點寫入 weakness 記錄。
- 過關回寫：測試全過 + review 完成後，server 端寫入 `user_lesson_mastery` 達亮燈門檻，並推薦下一個可學節點（沿用概念型節點的規則）。
- 出題與 review 的 LLM 呼叫納入現有 llm-usage-limit 配額。

## Capabilities

### New Capabilities

- `practice-session`: 實作型節點的完整流程——出題（題目 + 起始碼 + 測試）、Sandpack 編輯與瀏覽器內跑測試、AI code review、雙軌驗收後掌握度回寫與下一步推薦。

### Modified Capabilities

- `lesson-session`: 課程頁入口依節點型別分流的要求——概念型走對話 session，實作型走 practice session（原 spec 隱含所有節點都走對話）。
- `weakness-tracking`: 弱點來源新增 AI code review 結果（原 spec 僅涵蓋概念檢核未過的弱點）。

## Impact

- **新增依賴**：`@codesandbox/sandpack-react`（編輯器 + 瀏覽器內測試執行）。
- **DB**：新增 practice session 資料表（題目、起始碼、測試碼、使用者程式碼、狀態）；`user_lesson_mastery`、weakness 資料表沿用。
- **API**：新增出題與 code review 端點（掛在 `/api/lesson/[slug]` 下）；沿用 auth 保護與 LLM 配額檢查。
- **UI**：`/lesson/[slug]` 頁面分流；新增實作題版面（題目面板 + Sandpack）。
- **LLM**：出題與 review 走 AI Gateway、`google/gemini-3-flash`（成本政策）。
