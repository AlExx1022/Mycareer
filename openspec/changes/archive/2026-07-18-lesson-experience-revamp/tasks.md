## 1. 資料與型別

- [x] 1.1 lesson_session 新增 `units_state` jsonb 欄位（drizzle additive migration），`STATE_VERSION` 升 2，snapshot 型別擴充（units、currentUnit、作答結果），版本不符舊 session 重開
- [x] 1.2 `src/lib/lesson-session/units.ts`：題型 zod schema（discriminated union：choice / fill / match 含 answer，free 含 expectedPoints，皆含 explanation、wrongSummary）、單元導出（examPoints → units）、批次出題（`generateObject` + 失敗重試一次，出題規則含讀碼/補碼題與 150 字內教學步調）、客觀題判定（choice/match 全等、fill trim+小寫+同義答案陣列）、問答題判定（小型 `generateObject` 對照 expectedPoints）、client payload 剝除函式（去 answer/expectedPoints/explanation/wrongSummary）

## 2. API

- [x] 2.1 改造 `POST /api/lesson/[slug]/chat`：單元階段——進入單元時出題落 snapshot（計一次額度）、輕量教學文字 streaming 後以 data part 附剝除版當前題；全部單元完成後交回既有 sessionGraph 收尾檢核（teachNode 改為收尾開場指示）
- [x] 2.2 新增 `POST /api/lesson/[slug]/answer`：auth 檢查、客觀題從 snapshot 取正解比對（不經 LLM 不計額度）、問答題 LLM 判定（計一次額度）、回傳對錯 + 解析 + 單元進度 + 答對時的下一題；答錯首次寫 weakness_record（criterion=examPoint、summary=wrongSummary），同題不重複寫

## 3. UI

- [x] 3.1 `lesson-chat.tsx` 渲染 data-question part：選擇題選項按鈕、填空輸入框、配對 click-to-pair、問答輸入框，作答打 `/answer`，對錯與解析就地顯示，答錯可重答、答對才顯示下一題（一次一題）
- [x] 3.2 單元進度指示（N/M）與單元完成回饋（GSAP 慶祝動畫），完成後自動請求下一單元教學
- [x] 3.3 收尾檢核與過關/下一站推薦沿用既有文字輸入對話流程，顯示不變

## 4. 驗證

- [x] 4.1 units.ts self-check（仿 skill-tree.selfcheck.ts）：題型 schema 驗證、fill 比對規則、match 亂序判定、payload 剝除不含正解與判定要點、同題重複答錯不重複寫弱點
- [x] 4.2 API 層驗證（curl + SQL）：出題落 snapshot 且 client payload 無答案、答對推進、答錯回解析 + weakness 落檔一次、問答題判定計額度、未登入 401、出題超額 429、偽造答對不被採信
- [x] 4.3 瀏覽器手動驗收（使用者執行）：完整上完一個概念節點——多單元節奏、混合題型 widget（含讀碼/補碼題）、一次一題、完成動畫、收尾檢核過關亮燈
