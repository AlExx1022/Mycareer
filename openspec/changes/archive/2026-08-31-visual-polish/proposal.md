# visual-polish（C6.1）

## Why

作品集要拿得出手，現況有三個視覺硬傷：(1) create-next-app boilerplate 殘留——`globals.css` 的 dark scheme 讓系統深色模式下課程頁黑底配深色文字、body 字體是 Arial、metadata title 還是 "Create Next App"；(2) 技能樹地圖是水平捷運圖、需橫向捲動，手機體驗差，而主要使用情境預期在手機；(3) 各頁樣式散落、容器與 header 不一致。

## What Changes

- **基底修正**：產品定調 light-only——移除 `globals.css` 的 dark media query，body 底色/文字/字體（Geist）統一定義；metadata title/description 換成產品名與一句話；課程頁補底色。
- **技能樹直立式**：`layoutSkillTree` 改為直立單欄——Unit 帶縱向堆疊、依賴鏈由上往下、topic 聚群沿縱向排列，手機一屏寬度內直向捲動即可看完整路線；桌機同一 layout（置中限寬）。渲染機制（GSAP、狀態燈、車站樣式）不動。
- **全站一致性**：以 frontend-design skill 調整——統一頁面容器/header/返回連結樣式，login/signup 對齊主配色，landing（login 頁）加一句話說明產品。
- 不做：UI 套件（shadcn 等，現有手寫 Tailwind 已足）、dark mode 正式支援、C6.2 的體感問題（生成等待等）。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `skill-tree-ui`: 地圖 layout 由水平捷運圖改為直立單欄（手機直向捲動），聚群與依賴連線語意不變。

## Impact

- **UI**：`globals.css`、`layout.tsx`（字體/metadata）、`src/lib/skill-tree.ts`（layout 函式重算座標）、`skill-tree-map.tsx`、`lesson/[slug]/page.tsx`、login/signup 頁、`review` 兩頁微調。
- **零後端**：無 schema/API/LLM 變更。
- **selfcheck**：skill-tree selfcheck 的 layout 相關斷言隨座標邏輯更新。
