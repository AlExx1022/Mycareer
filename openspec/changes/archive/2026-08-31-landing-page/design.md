# landing-page 設計

## Context

`/` 目前是技能樹，未登入被 `middleware.ts` 攔到 `/login`。全站手寫 Tailwind，字體 Nunito（`--font-nunito`）+ Geist Mono（`--font-geist-mono`）已在 root layout 載入，動畫用 GSAP（`gsap` + `@gsap/react`，`ScrollTrigger` 已隨套件安裝，無需新依賴）。技能樹的視覺語彙：糖果四色 `#1CB0F6` / `#58CC02` / `#CE82FF` / `#FF9600`、墨色 `#17242D`、強調橘 `#E8590C`、3D `box-shadow` 按鈕、`rounded-2xl/3xl`。

面試官的閱讀情境：桌機、幾分鐘、想知道「這人做了什麼決定」而不是「這產品有什麼功能」。

## Goals / Non-Goals

**Goals:**

- 公開網址打開就看得到專案在做什麼、技術上做了哪些取捨
- 一鍵用 demo 帳號進站，不需註冊
- 頁面本身即作品：LP 進 App 視覺零接縫

**Non-Goals:**

- 行銷用 LP（不做定價、見證、電子報、聯絡表單）
- 多語系、深色模式
- 圖表函式庫、產品截圖（圖一律手寫 SVG）

## Decisions

### D1 `/` 讓給 LP，技能樹搬 `/tree`

面試官只會拿到根網址。`/about` 式的旁路要靠口頭補充網址，浪費一次注意力。代價是一次路由搬遷，牽動 middleware matcher、`revalidatePath("/")`、三處登入導向、三處返回連結、sidebar 的 href 與 active 特例——全部一次改完並實測登入流程，再開始寫 LP，避免壞掉的導向被誤判成 LP 的 bug。

`/tree` 未登入維持導向 `/login`（不改成導回 LP）：登入頁本來就有 demo 入口，導回 LP 只是多一跳。

### D2 延用 App 視覺語彙，不另立「科技感」皮

工程可信度靠 Geist Mono 標註、真實 phase 名稱與線圖給，不靠換成深色系。LP 與 App 同一套糖果色與字級，面試官點進 demo 時沒有斷層，一致性本身就是設計主張的一部分。

### D3 Signature：LP 本身是一條技能樹

左側一條蜿蜒 SVG 路線貫穿全頁，五個站對應四段內容加終點行動區，捲動到哪站亮到哪站（ScrollTrigger）。編號 L01–L04 在此是誠實的資訊——內容真的是有序路徑。讀者讀完 LP 等於先走過一次產品的核心隱喻。

段落標題放在桌機左欄並黏在視窗上緣，內容吃滿右側寬度：避免整頁擠成中央一條窄柱，也讓讀者往下捲時知道自己在哪一段。

`prefers-reduced-motion: reduce` 時全部站點靜態亮起、無捲動綁定，沿用 `skill-tree-map.tsx` 既有的 `gsap.matchMedia("(prefers-reduced-motion: no-preference)")` 寫法。

### D4 兩張資訊型 SVG，讀者可能不是工程師

LP 會給 HR 看，架構細節（LangGraph 狀態機、rubric 判定、技術棧取捨）一律不寫——那些留在面試口頭與 readme。頁面只回答四個問題：在做什麼、為什麼需要、怎麼學、它怎麼記得你。

| 圖 | 講什麼 | 為什麼要圖 |
| --- | --- | --- |
| 技能樹片段（hero） | 已學會／你在這裡／裂開／還沒解鎖 | 「裂開」是最難用文字講清楚的差異點 |
| 記憶三狀態 | 學會了 → 一陣子沒碰 → 裂開了 → 複習清單 → 重新亮燈 | 這是一個回圈，文字列點會失去「繞回來」的資訊 |

砍掉的兩張：LangGraph 狀態機（讀者不需要知道流程節點名）、掌握度衰減座標曲線（有分數軸與門檻線，對非技術讀者是噪音，改為三狀態敘事）。技術訊息濃縮成結尾一排標籤，HR 抓得到關鍵字，不佔篇幅也不解釋。

### D5 統計數字由 curriculum 衍生

`content.ts` 直接 import `curriculum` 算出 units / lessons / concept / practice / topics。readme 現況寫 26 節點（21+5），實際為 24（20+4）——面試頁寫錯數字是最不划算的錯誤，一律從資料算。

### D6 四色 hex 在 LP 重新宣告，不從 `skill-tree-map.tsx` import

`ROUTES` 住在 `skill-tree-map.tsx`，該檔是 `"use client"` 且 module scope 就 `gsap.registerPlugin(useGSAP)`；import 會把 GSAP 拉進 LP 的 server component 樹。四個 hex 重寫在 `content.ts` 比為此重構 App 元件便宜。

### D7 檔案切分

```
src/app/page.tsx              LP 組裝（server component，只排版）
src/app/landing/content.ts    文案常數 + curriculum 衍生統計 + 配色
src/app/landing/spine.tsx     左側路線 + ScrollTrigger 亮燈（client）
src/app/landing/section-*.tsx 六段
src/app/landing/diagram-*.tsx 三張 SVG（純 presentational）
src/app/tree/page.tsx         由現行 src/app/page.tsx 平移
```

文案與統計不寫在 view 層；SVG 元件不含資料存取，只吃 props 與常數。

## Risks / Trade-offs

- [路由搬遷漏改一處 → 標記已會不刷新、登入後 404]：改動點已逐一列在 tasks，且 Step 1 獨立驗收後才動 LP。
- [LP 加 ScrollTrigger 增加首頁 JS]：只有 spine 是 client component，三張圖與六段皆 server component；reduced-motion 下不啟動。
- [LP 與 App 同色系，少了「面試用網站」的視覺衝擊]：刻意的取捨，一致性優先；衝擊力交給 hero 的裂開站與衰減曲線。
- [demo 帳號被公開使用累積髒資料]：既有 `LLM_DAILY_LIMIT`（預設 50）已擋成本，資料髒污為可接受風險，必要時重跑 seed。
