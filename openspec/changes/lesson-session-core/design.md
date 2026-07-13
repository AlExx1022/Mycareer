## Context

C1 已有 lesson（含 examPoints、rubric）與 user_lesson_mastery；C2 地圖頁以 `MASTERY_THRESHOLD = 70`（`src/lib/skill-tree.ts`）判定亮燈。課程頁 `src/app/lesson/[slug]/page.tsx` 目前是 placeholder。本 change 為概念型節點補上 AI 學習循環。求職作品集定位：LangGraph.js 是刻意展示的技術棧，不可省略。

## Goals / Non-Goals

**Goals:**

- 概念型節點可完整走完「教學 → 蘇格拉底檢核 → 答錯換角度再教 → 過關」，過關即寫掌握度、樹上亮燈。
- 對話全程 streaming，session 可中斷後續聊（狀態落 DB）。
- 檢核失敗留下語意級弱點記錄（C5 的資料來源）。
- 使用者級 LLM 呼叫限額。

**Non-Goals:**

- 實作型節點（Sandpack、code review）→ C4。
- 掌握度衰減、複習佇列 → C5。
- demo 帳號預錄回放 → C6（本次只做「限額」這一層成本防護）。

## Decisions

### D1: LangGraph.js 負責流程編排，AI SDK 負責模型呼叫

LangGraph `StateGraph` 定義 session 狀態機（節點：`teach` → `check` → `evaluate` → 分支 `reteach`（換角度，回 `check`）或 `pass`（掌握度更新 + 推薦下一節點））。graph 節點內用 AI SDK v6 呼叫模型，走 Vercel AI Gateway 的 `"provider/model"` 字串。

- 為何不用 LangChain 的 chat model 包裝：AI SDK 直接支援 Gateway 與 UI streaming（`useChat`），少一組 `@langchain/anthropic` + provider key 管理；LangGraph 節點就是普通 async function，兩者相容無縫。
- 替代方案「純 AI SDK 手寫 if/else 流程」被否決：狀態機是作品集要展示的核心，且 C5 複習 session 會複用同一套 graph 模式。

### D2: session 狀態存自建表，不用 LangGraph checkpointer

`lesson_session` 表：`(userId, lessonId)` PK、`phase`（teach/check/reteach/passed）、`messages` jsonb、`checkState` jsonb（當前考點進度、已失敗角度）、`updatedAt`。每次請求：讀 row → 還原 graph state → 跑一步 → 寫回。

- 官方 `@langchain/langgraph-checkpoint-postgres` 需要 `pg` driver 與自管 migration，與現有 Neon serverless + Drizzle 疊床架屋；自建一張表用既有 Drizzle 管線即可。
- 代價：不能用 LangGraph time-travel 等進階功能——本產品用不到。

### D3: 檢核以 rubric 逐項過，通過寫 score 100

`evaluate` 節點拿 lesson.rubric 逐項判定使用者回答；全部 criterion 通過才 `pass`，寫 `score: 100`（≥ MASTERY_THRESHOLD 亮燈，與手動標記已會一致）。部分通過 → 針對未過的 criterion 換角度再教。不做部分分數——衰減模型（C5）才需要細粒度，屆時再調。

### D4: streaming 走 Next.js route handler + `useChat`

`POST /api/lesson/[slug]/chat`：驗 session、驗限額、載入 lesson_session、跑 graph 一步、以 AI SDK stream response 回傳。前端課程頁改 client component 用 `useChat`。掌握度寫入與弱點記錄在 route 內完成（server-side，不信任 client）。

### D5: 限額 = 每使用者每日 N 次 LLM 呼叫，DB 計數

`llm_usage` 表：`(userId, day)` PK、`count`。每次 chat 請求先 `INSERT ... ON CONFLICT count+1` 並檢查上限（環境變數 `LLM_DAILY_LIMIT`，預設 50），超額回 429 附友善訊息。不做 token 計量、不做付費方案——demo 成本防護夠用。

### D6: 弱點記錄是語意文字，不是錯題快照

`weakness_record` 表：`id`、`userId`、`lessonId`、`criterion`（對應 rubric 項）、`summary`（LLM 生成的一句話誤解描述，如「以為 closure 捕獲的是值而非變數參照」）、`createdAt`。`evaluate` 判定某 criterion 未過時順手生成寫入。append-only，C5 讀取。

## Risks / Trade-offs

- [LLM 判定 rubric 不穩定，可能誤放行或死不放行] → rubric 的 passCondition 是人工寫的明確條件，evaluate 用結構化輸出（每 criterion 回 pass/fail + 理由）；prompt 內附考點原文降低漂移。
- [graph state 與 messages 存 jsonb，schema 演進沒有 migration 保護] → state 加 `version` 欄位，不相容時重開 session（學習紀錄在 mastery/weakness 表，不受影響）。
- [單一 route 內跑多次 LLM 呼叫（教學 + 評估 + 弱點摘要）拉長回應時間] → 評估與弱點摘要合併為一次結構化呼叫；Vercel function timeout 300s 充足。
- [限額用 DB 計數在併發下可能少算] → `ON CONFLICT ... count = count + 1` 原子遞增，無此問題。

## Open Questions

- 模型選擇（gateway 字串）先用 `anthropic/claude-sonnet-5` 之類單一模型，成本壓力大再降級 haiku——實作時定案即可，不阻塞。
