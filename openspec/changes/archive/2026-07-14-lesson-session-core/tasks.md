## 1. 基礎設施

- [x] 1.1 安裝依賴：`@langchain/langgraph`、`ai`（AI SDK v6）；設定 AI Gateway API key 環境變數（本地 .env 與 Vercel env）
- [x] 1.2 Drizzle schema 新增 `lesson_session`、`weakness_record`、`llm_usage` 三張表並產生 migration（design D2/D5/D6 欄位）

## 2. LLM 限額

- [x] 2.1 實作限額 helper：原子遞增當日計數、超限判定（`LLM_DAILY_LIMIT` 環境變數，預設 50），附 self-check

## 3. Session 狀態機

- [x] 3.1 實作 LangGraph StateGraph：teach → check → evaluate → 分支 reteach / pass，state 含 messages、phase、rubric 進度（design D1）
- [x] 3.2 evaluate 節點：以結構化輸出逐 criterion 判定 pass/fail + 誤解摘要（一次 LLM 呼叫，design D3/D6）
- [x] 3.3 session 持久化：讀寫 `lesson_session`（含 state version 欄位，不相容時重開 session）

## 4. API 與資料回寫

- [x] 4.1 `POST /api/lesson/[slug]/chat` route：驗登入（401）、驗限額（429）、載入 session、跑 graph、AI SDK stream 回傳
- [x] 4.2 pass 時 server-side 寫入 user_lesson_mastery（score 100）；criterion 未過時寫入 weakness_record
- [x] 4.3 pass 訊息附下一個可學節點推薦與連結（依既有 skill-tree 依賴推導；無可學節點時明確告知）

## 5. 課程頁 UI

- [x] 5.1 `lesson/[slug]/page.tsx` 概念型節點改為 streaming 對話 UI（`useChat`），保留考點區塊；practice 型節點維持 placeholder
- [x] 5.2 進頁時還原歷史對話與檢核進度；已過關節點顯示過關狀態
- [x] 5.3 超額（429）與錯誤狀態的 UI 呈現

## 6. 驗收

- [x] 6.1 端到端驗證：完整上完一個概念型節點（如 closure），檢核通過 → 技能樹該節點亮燈、weakness_record 有失敗記錄、限額計數正確
- [x] 6.2 部署 Vercel 並在公開網址驗證 streaming 與限額
