## 1. 課綱重策展

- [x] 1.1 `react-junior-mid.ts` 型別擴充：`CurriculumLesson` 加 `topic: string` 與 `intro: { hook: string; scenarios: string[]; outcome: string }`（concept 節點必填），examPoints 註明依難度遞進排序的策展規則
- [x] 1.2 以 LLM 生成新課綱草稿：原 12 概念節點的每個 examPoint 升格為節點（約 30 個），每節點含 intro、2–3 個難度遞進 examPoints、rubric、topic；同 topic 以 dependsOn 串鏈，practice 節點 dependsOn 改指新 slug
- [x] 1.3 作者人工審訂課綱內容（使用者執行），定稿後才進 seed

## 2. 資料層

- [x] 2.1 lessons 表加 `intro` jsonb、`topic` text 欄位（drizzle additive migration）
- [x] 2.2 seed script 支援重策展落地：舊 slug 節點連同 mastery / weakness / session 紀錄依 FK 順序清除後重種，冪等與循環依賴防呆維持；skill-tree selfcheck 補 intro/topic/難度排序驗證
- [x] 2.3 技能樹 API 回傳補 `topic`

## 3. lesson-session

- [x] 3.1 課程頁課前導入：`page.tsx` 以固定版型渲染 intro（hook／場景／成果），考點列表降為輔助資訊，零 LLM
- [x] 3.2 `chat/route.ts` 單元教學 instructions 改為 200–400 字結構模板（是什麼 → 為什麼 → 類比 → 程式碼例，程式碼上限 8 行、第一單元可不給碼），收尾檢核不動
- [x] 3.3 `lesson-chat.tsx` 單元難度標籤 chip（基礎／進階／深入，由單元順序 client 端推導）

## 4. 技能樹地圖

- [x] 4.1 `skill-tree-map.tsx` layout 改為 Unit 區塊內按 topic 聚群、群內依賴鏈排列，容納約 30 節點；渲染機制（GSAP、狀態燈）不動

## 5. 驗證

- [x] 5.1 selfcheck / API 層驗證：seed 後節點數與 intro/topic 完整性、技能樹 API 含 topic、chat 教學訊息符合模板約束（抽測）
- [x] 5.2 瀏覽器手動驗收（使用者執行）：地圖看到 ~30 節點聚群路線；進「JSX 編譯成什麼」類節點——導入 → 分層單元（難度標籤、200–400 字教學）→ 收尾亮燈，單節點 5–10 分鐘
