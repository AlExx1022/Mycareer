# decay-review-queue（C5）

## Why

產品賣點「AI 記得你」目前只有記錄（weakness_record、mastery），沒有記憶的行為：學會的節點永遠亮著，弱點記錄寫入後無人讀取。C5 讓時間與弱點驅動複習——掌握度隨時間衰減、節點裂開、複習 session 刻意打向歷史弱點，完成 Phase 2 的核心循環。

## What Changes

- **掌握度時間衰減**：以遺忘曲線衰減有效掌握度（讀取時計算，無排程），衰減公式與裂開門檻在本 change 定案。曾亮燈節點的有效掌握度跌破門檻 → 裂開（cracked）；裂開不重新上鎖下游（解鎖判定沿用原始分數）。
- **節點裂開狀態**：技能樹地圖啟用既有預留的 `cracked` 狀態視覺，裂開節點仍可點入。
- **複習頁今日佇列**：新增 `/review` 頁，列出裂開節點與各自的歷史弱點摘要，點擊進入該節點的複習 session。
- **弱點導向複習 session**：重用 C4.5 題型系統（選擇/填空/配對/問答、批次生成、逐題作答、server 判定），出題 prompt 注入該節點的弱點記錄摘要，題目記錄來源弱點 id（可追溯）。完成複習 → 掌握度回寫（分數與 assessedAt 更新）→ 節點復亮。
- 不做：排程/cron（衰減為讀取時推導）、複習排程演算法（SM-2 等，門檻制即可）、demo 帳號預灌（C6）。

## Capabilities

### New Capabilities

- `mastery-decay`: 掌握度時間衰減模型——有效掌握度公式、裂開門檻、裂開狀態推導規則（讀取時計算）。
- `review-queue`: 複習頁今日佇列與弱點導向複習 session——佇列組成、出題打向弱點、完成後掌握度回寫與復亮。

### Modified Capabilities

- `skill-tree-ui`: 節點狀態視覺化的 cracked 觸發條件定案（依 mastery-decay 推導）；地圖入口顯示複習佇列提示。

## Impact

- **DB**：新增 review session 持久化（題目 snapshot、進度、來源弱點 id，additive）；既有表結構不動。
- **API**：技能樹 API 回傳補有效掌握度/裂開狀態；新增複習佇列查詢與複習 session 路由；複習出題與問答判定計 LLM 額度（沿用 llm_usage）。
- **UI**：`skill-tree-map.tsx`（cracked 視覺啟用、佇列提示）、新 `/review` 頁與複習 session 介面（重用課程頁題目 widget）。
- **lib**：`skill-tree.ts` 的 `deriveNodeStates` 改吃有效掌握度；新增 decay 純函式與 selfcheck。
