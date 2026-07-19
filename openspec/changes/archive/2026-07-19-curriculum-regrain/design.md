## Context

C4.5 上線後手動驗收回饋（2026-07-18）：單一概念節點涵蓋太多概念（「JSX 與渲染模型」一節含編譯本質、render/commit、DOM 衝突三個考點），且進節點開場生硬——page 只列考點（`page.tsx:74`），chat 第一則教學被壓在 150 字內（`chat/route.ts:110`）就直接開考，零基礎使用者缺背景導入。課綱是人工策展檔 `src/db/curriculum/react-junior-mid.ts`（2 Unit、12 lesson、每 lesson 2–3 examPoints），經 db:seed 落 DB；C4.5 小單元制以 examPoint 為單元邊界。

## Goals / Non-Goals

**Goals:**

- 一節點一概念：examPoint 升格為獨立節點（約 30 個），單節點 5–10 分鐘完課。
- 課前導入：人工策展 intro（為什麼學、應用場景、學完能做什麼），進場直接渲染、零 LLM 成本。
- 漸進式深度：節點內 examPoints 依難度遞進（直覺認識 → 原理理解 → 深入/誤解），單元教學放寬為 200–400 字結構模板。
- 地圖呈現 ~30 節點的完整學習路線，同原主題節點視覺聚群（roadmap.sh 的密度感）。

**Non-Goals:**

- 遊戲化視覺（徽章、streak、更多動畫）——另立 change。
- 三層 schema 或點擊展開式地圖——粒度切細後單層地圖已足夠。
- practice 節點（Sandpack）機制不動——僅更新其 dependsOn 指向新 slug。
- 舊資料遷移——slug 全換，既有進度作廢（上線前產品，無真實使用者）。
- C4.5 出題/判定/額度機制不動。

## Decisions

### D1: examPoint 升格為節點，課綱整份重策展

原 12 概念節點的每個 examPoint 變成一個節點，每個新節點再細分 2–3 個難度遞進的 examPoints（沿用 C4.5 單元制，一 examPoint 一單元）。`CurriculumLesson` 新增 `topic: string`（原節點主題名，如「JSX 與渲染」），同 topic 節點以 dependsOn 串成鏈。內容由 LLM 生成草稿、作者人工審訂後定稿（同 C1 模式）。

- 替代方案「Unit → Topic → Lesson 三層 schema」被否決：只為地圖聚群加一層資料是重複結構，`topic` 標籤欄位就夠。
- 單元總量從 ~30 變 ~60–90，整條路徑 LLM 出題呼叫總量約 2–2.5×，但單節點成本不變、使用者級額度機制（C3）不動，gemini-3-flash 成本可接受。

### D2: intro 為結構化策展欄位，進場直接渲染

`CurriculumLesson` 與 lessons 表新增 `intro` jsonb：`{ hook: string; scenarios: string[]; outcome: string }`（為什麼學／實際場景 1–2 個／學完能做什麼）。lesson page（server component）以固定版型渲染在「開始上課」之前，取代現行純考點列表——考點列表保留但降為輔助資訊。不經 LLM、不計額度、內容品質由人工把關。

- 替代方案「intro 由 LLM 開場生成」被否決：品質不穩、每次進場燒額度，且正是這次「開場生硬」回饋的來源。
- 替代方案「intro 用單一 markdown 字串」被否決：三段固定版型（hook／場景／成果）結構化才能穩定渲染，策展時也有明確填寫框架。

### D3: 單元教學指示改為 200–400 字結構模板，難度標籤由順序推導

`chat/route.ts` 單元教學 instructions 改為：依模板「是什麼 → 為什麼 → 類比 → 程式碼例」200–400 字，程式碼上限放寬至 8 行、第一單元（基礎層）可不給碼。單元難度標籤（基礎／進階／深入）由單元順序在 client 推導：2 單元 = 基礎/進階，3 單元 = 基礎/進階/深入，顯示為單元開頭 chip——零 schema、零持久化變更。

- 替代方案「examPoints 帶顯式 level 欄位」被否決：策展時已依難度排序，順序即層級，加欄位是重複資料。

### D4: 重策展以 truncate + reseed 落地，舊進度作廢

seed script 重跑：lessons 全換 slug，連帶 user_lesson_mastery、weakness_record、lesson_session 舊紀錄一併清除（truncate cascade 或依 FK 順序清空）。demo 帳號種子流程重跑。上線前產品、無真實使用者，不寫遷移。

### D5: 地圖只調 layout，聚群靠 topic 欄位

`skill-tree-map.tsx` 維持現有渲染機制（GSAP、狀態燈），layout 改為：Unit 為大區塊 → 內部按 `topic` 聚成小群（群內依 dependsOn 鏈排列）。skill-tree API 回傳補上 `topic`。不做展開收合、不做縮放。

## Risks / Trade-offs

- **重策展工作量**：~30 節點 × (intro + 2–3 examPoints + rubric) 全靠人工審訂，是本 change 最大成本——LLM 草稿先行可壓低，但作者審訂時間不可省。
- **節點變多的完課壓力**：路徑從 12 站變 30 站，視覺上變長；單站時間縮短（5–10 分鐘）與地圖聚群設計要能傳達「小步快走」，否則有勸退感。驗收時特別確認。
- **教學字數放寬與節奏感的平衡**：150 → 200–400 字是回應「太淺」回饋，但若 LLM 頂格輸出 400 字仍可能回到「一次給太多」。模板結構（類比、程式碼例分段）比字數上限更關鍵，eval 時盯排版。
