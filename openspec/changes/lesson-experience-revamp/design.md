## Context

C3 的概念節點學習循環是純對話：teach → 蘇格拉底檢核（每輪 LLM evaluate）→ reteach → 亮燈。自測回饋指出四個結構性問題：單則訊息太重、題目文字太多、答題只有口述、整節課十來輪沒有節奏。lesson_session snapshot 為 jsonb（`store.ts`），UI 是 `lesson-chat.tsx` 的 useChat 對話流，chat route 逐輪吃 LLM 額度。C5（複習佇列）要動態生成補強練習，會重用本 change 的題型系統。

## Goals / Non-Goals

**Goals:**

- 小單元制：每考點一單元，「短教學 → 3–5 題 → 完成回饋」，節奏感與成就感。
- 題型多樣化：選擇、填空、配對、問答混用，讀碼/補碼以題幹帶程式碼的選擇/填空呈現；客觀題即時判定不吃 LLM，問答題 LLM 判定計額度。
- 好閱讀：一次只呈現一題、單元教學 150 字內。
- 保留 rubric 蘇格拉底檢核作為亮燈 gate（C3 spec 語意不變）。
- 答錯寫 weakness_record，C5 可溯源。

**Non-Goals:**

- practice 節點（C4 範圍）不動。
- 掌握度粒度仍為節點級——單元進度只存 session，不進 user_lesson_mastery（C5 衰減模型免受影響）。
- 題目難度分級、題庫複用、跨使用者共享題目。
- 舊 session 遷移——snapshot 結構改版，未完課的 session 重新開始（上線前產品，無真實使用者）。

## Decisions

### D1: 單元 = examPoint，不新增課綱資料

單元直接由既有 `lesson.examPoints` 導出（每節點 2–4 個考點 → 2–4 個單元），不改 curriculum 結構、不跑 migration。每單元流程：短教學（streaming）→ 該考點的 3–5 題 → 完成回饋。全部單元完成後進入既有 rubric 檢核收尾。

- 替代方案「課綱新增 unit 層」被否決：examPoints 已是天然的單元邊界，加層是重複資料。

### D2: 以單元為批次出題，正解與解析一次生成

進入單元時一次 `generateObject` 生成該單元 3–5 題（type、prompt、options/pairs、answer、explanation、wrongSummary），落 snapshot，計一次 LLM 額度。內部題型型別為 discriminated union：`choice`（單選）、`fill`（填空，接受同義答案字串陣列）、`match`（配對）、`free`（問答題，含判定要點 expectedPoints 供 server 判定，不含固定正解）。LLM 生成端則用全欄位必填的平面 schema、code 端轉換並驗證必要條件——實測 Gemini 結構化輸出對 discriminated union / 巢狀物件不可靠（pairs 被壓成字串陣列），平面化後穩定。讀碼/補碼題不是獨立題型——出題規則要求適合的考點以「題幹帶 TypeScript 片段」的 choice/fill 呈現（這段 code 輸出什麼、補上挖空的一行），真正動手寫程式維持在實作型節點（C4）。

- 逐題出題被否決：一單元 3–5 次呼叫 vs 一次，成本與延遲都輸；批次生成也讓題目彼此不重複。
- 「單元內嵌 Sandpack 小型寫碼題」被否決（2026-07-18 使用者定調）：每題載入 bundler 太重，讀碼/補碼題已覆蓋輕量實作感。

### D3: 作答走獨立 endpoint——客觀題比對正解零額度，問答題 LLM 判定計額度

新增 endpoint `POST /api/lesson/[slug]/answer`：收 questionId + 使用者作答。客觀題（choice/fill/match）server 從 snapshot 取正解同步比對，不經 LLM、不計額度；問答題（free）以小型 `generateObject` 對照該題 expectedPoints 判定對錯並產生一句回饋，計一次額度（整節課總呼叫數仍低於現行逐輪檢核）。回應帶對錯 + 解析 + 單元進度 + 下一題（答對時才給），天然保證一次一題。發給 client 的題目 payload 一律剝除 answer/expectedPoints/explanation——判定只在 server 端，client 偽造不了。

- 走 chat route streaming 被否決：判定是同步比對，毫秒級回應才有多鄰國的即時感，streaming 是負優化。
- fill 題比對規則：trim + 小寫 + 接受多組同義答案（生成時要求列出）；比對不過但形近的情況接受誤判為錯——解析會顯示正解，體驗可接受。

### D4: rubric 檢核收尾保留，LangGraph graph 不擴編

單元流程是資料驅動的線性進度（無多輪 LLM 狀態轉移），由 route + `src/lib/lesson-session/units.ts` 處理；既有 sessionGraph（teach/evaluate/reteach/pass）只負責收尾檢核階段,teach node 的角色改為單元教學指示。亮燈條件不變：rubric 全過才寫 mastery——客觀題是練習與理解鋪墊，不是過關依據，C3 spec「檢核以 rubric 為據」語意保留。

- 把單元流程塞進 StateGraph 被否決：同 C4 design D2 的理由，沒有狀態轉移就不需要狀態機。

### D5: 單元狀態存 lesson_session 新 jsonb 欄位，STATE_VERSION 升到 2

lesson_session 加一個 `units_state` jsonb 欄位（`units[]`：考點、題目陣列、每題作答結果；`currentUnit`），additive migration，不動既有欄位。`STATE_VERSION` 升到 2，`loadSession` 遇到版本不符的舊 session 重新開始（既有機制，Non-Goal 已定調）。無新表。

### D6: UI 以 data parts 傳題目，widget 內嵌對話流

chat route 用 AI SDK 的 UI message stream 在教學文字後附上 `data-question` part（已剝除答案）；`lesson-chat.tsx` 依題型渲染 widget（選項按鈕、填空輸入框、click-to-pair 配對、問答輸入框），作答打 `/answer`，對錯與解析就地顯示，答對才出現下一題——一次只呈現一題。單元教學訊息 prompt 限 150 字內。單元完成觸發 GSAP 慶祝動畫與進度指示（N/M 單元）。收尾檢核沿用既有文字輸入對話。

### D7: 答錯寫 weakness_record，每題只記第一次錯

客觀題答錯即寫入 weakness_record：criterion = 題目對應的 examPoint，summary = 「題幹要旨 + 錯選內容」一句話（生成題目時一併產出 wrongSummary 模板，不另呼叫 LLM）。同一題重複答錯不重複寫，避免灌爆 C5 複習佇列。

## Risks / Trade-offs

- [LLM 生成題目品質不穩（正解錯誤、配對太簡單）] → zod schema 驗證 + 失敗重試一次（沿用 C4 模式）；正解錯誤靠解析顯示讓使用者發現，demo 定位可接受，C5 前不上人工審題。
- [fill 題同義答案覆蓋不全，正確答案被判錯] → 生成時要求列 2–4 組同義答案；解析即時顯示降低挫折；仍誤判屬已知天花板。
- [snapshot 無 migration，進行中 session 作廢] → 上線前無真實使用者，重開成本為零。
- [題目 payload 在 snapshot 含正解，chat route 歷史訊息若整包回傳會洩題] → route 組裝 client payload 時統一走剝除函式，UI 還原歷史也只拿剝除版。

## Open Questions

- 無。模型沿用 `google/gemini-3-flash`；單元出題計一次額度、客觀題判定零額度。
