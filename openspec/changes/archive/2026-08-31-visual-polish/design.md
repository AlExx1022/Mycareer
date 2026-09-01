# visual-polish 設計

## Context

全站為手寫 Tailwind + 固定配色（主色 `#17242D`、底 `#F5F7F6`、路線色 4 色、強調 `#F0A202`），無元件庫。地圖 layout 是純函式 `layoutSkillTree`（column = 拓撲層、Unit 水平帶），寬度隨層數線性成長（目前 24 節點約 2000px），依賴橫向捲動。globals.css 為 boilerplate 原樣。

## Goals / Non-Goals

**Goals:**

- 手機直向捲動看完整技能樹，無橫向捲動
- 消滅深色模式黑底黑字，全站觀感一致

**Non-Goals:**

- dark mode 正式支援（作品集階段 light-only 定調，成本低、風險小）
- UI 套件導入（現有元件量不值得）
- 體感/效能問題（C6.2）

## Decisions

### D1 light-only：刪 dark media query，不做雙主題

黑底黑字的根源是 boilerplate 的 `prefers-color-scheme: dark` 只翻背景不翻整套配色。正式支援 dark 要把全站寫死的 `#17242D` 系列全部 token 化，投報比差；直接移除 media query、body 定死 `#F5F7F6`/`#17242D`/Geist，一次修掉所有頁面的深色模式問題。

### D2 直立式 layout：嚴格單線縱列，站名靠右

`layoutSkillTree` 改為單線縱列：每 Unit 內節點依拓撲層（同層依 position）由上往下一站一列，全部站點落在中央路線 x 上、站名移到圓圈右側；相鄰站以直線相連，跨站依賴與跨 Unit 轉乘以向左彎的貝茲呈現。Unit 帶縱向堆疊、topic 聚群為縱向包絡。輸出結構（`MapNode`/`TopicStrip`/`bands`）欄位不變，content 寬固定 320px（手機含頁邊距不溢出），桌機置中。

- 捨棄「同層橫排最多 2 站」：並排時站名可用寬度只剩 ~78px 塞不下節點標題；單線每站站名約 138px，且更貼近真實捷運圖的閱讀方式。
- 捨棄「桌機維持橫式、手機直式」雙 layout：兩套座標邏輯兩倍維護，roadmap.sh 式直立在桌機同樣成立。

### D3 一致性用 frontend-design skill 人工調，不建 design token 系統

頁面就 6 個，抽 token/theme 系統是為 6 頁建基礎設施。以 frontend-design skill 過一輪：統一容器寬、header 模式、返回連結、按鈕/卡片圓角與陰影，直接改 class。

## Risks / Trade-offs

- [直立圖高度變長，進場畫線動畫時間軸感受不同] → GSAP timeline 參數順手微調，機制不動。
- [同層節點多於 2 個時的換行規則影響聚群外框] → topic strip 以實際節點座標包絡計算（現行做法），自動適應。
- [light-only 與使用者系統深色偏好相衝] → 作品集可接受；未來要 dark 就全站 token 化一次做對。
