# Proposal: skill-tree-ui

## Why

C1 已把技能樹變成資料，但使用者登入後只看到空白首頁。技能樹地圖是產品的 demo 核心畫面——面試官與使用者理解這個產品的第一眼，也是 C3 學習循環的入口。

## What Changes

- 登入後首頁改為技能樹地圖：以 Unit 分區、依賴關係分層排列節點，畫出依賴連線。
- 節點狀態視覺化：亮燈（已掌握）、上鎖（前置未達成）、可學（預設）、裂開（視覺先做好，觸發邏輯留給 C5 的衰減）。
- GSAP 動畫：進場 stagger、節點狀態轉換、hover 回饋。
- 手動標記「我已經會了」：點節點可標記/取消，寫入掌握度（起點定位用，讓老手不用從頭上課）。
- 節點點擊入口：導向課程頁路由（頁面本體是 C3 的範圍，此處先建立入口與 placeholder）。

## Capabilities

### New Capabilities

- `skill-tree-ui`: 技能樹地圖頁——節點狀態推導與視覺化、依賴連線、GSAP 動畫、手動標記已會、課程入口。

### Modified Capabilities

（無——`skill-tree-data` 的既有需求不變，讀取沿用 C1 的查詢。）

## Impact

- **程式碼**：首頁改版（`src/app/page.tsx`）、技能樹 client 元件、狀態推導與分層 layout 的 helper、一個標記掌握度的 API route。
- **相依**：新增 `gsap` + `@gsap/react`（roadmap 指定，展示動畫能力）。
- **DB**：無 schema 變更，寫入沿用 `user_lesson_mastery`。
