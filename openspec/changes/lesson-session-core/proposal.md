## Why

技能樹與地圖頁（C1、C2）已上線，但點進節點只有 placeholder——產品的心臟「AI 教學 → 檢核 → 亮燈」的學習循環還不存在。C3 補上概念型節點的完整循環，讓公開網址第一次可以真正「上完一課」。

## What Changes

- 以 LangGraph.js 建立課程 session 狀態機：教學 → 蘇格拉底檢核 → 答錯換角度再教 → 掌握度更新，檢核以節點 rubric 為據。
- 課程頁改為 streaming 對話 UI（取代現有 placeholder），概念型節點可完整對話上課。
- 檢核未通過時寫入語意級弱點記錄（供 C5 複習佇列使用）。
- 檢核通過後更新該節點掌握度（技能樹亮燈），並推薦下一個節點。
- 使用者級 LLM 呼叫限額，保護公開網址成本。

## Capabilities

### New Capabilities

- `lesson-session`: 概念型節點的學習 session——狀態機流程（教學/檢核/再教/過關）、streaming 對話、掌握度回寫、下一步推薦。
- `weakness-tracking`: 檢核失敗時的語意級弱點記錄寫入與查詢。
- `llm-usage-limit`: 使用者級 LLM 呼叫限額與超額拒絕。

### Modified Capabilities

（無——skill-tree-ui 的「課程入口」需求已預留課程內容由後續 change 提供，掌握度資料模型沿用 skill-tree-data 現有 schema。）

## Impact

- **新依賴**：`@langchain/langgraph`、LLM SDK（經 Vercel AI Gateway 呼叫模型）。
- **DB**：新增 session 狀態、弱點記錄、LLM 用量三類資料表（Drizzle migration）。
- **程式碼**：`src/app/lesson/[slug]/page.tsx` 重寫為對話 UI；新增 chat streaming API route；`user_lesson_mastery` 寫入路徑沿用。
- **環境**：需要 AI Gateway / model provider 的 API key（Vercel env）。
