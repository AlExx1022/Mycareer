# landing-page（C6.3）

## Why

專案要拿去面試，但公開網址 `mycareer-pi.vercel.app` 開起來是登入頁——面試官在看到任何東西之前就先被要求註冊。專案的價值（檢核即課程、判定權不在模型、知識會裂開）目前只寫在 repo 的 readme 裡，網站本身完全沒講。

需要一個公開的 landing page，用「快速簡報」的方式在幾分鐘內把產品定位與工程決策交代完，並提供 demo 帳號一鍵進站逆玩。

## What Changes

- **路由搬遷**：`/` 改為公開 landing page，技能樹搬到 `/tree`。連帶 middleware matcher、`revalidatePath`、登入/註冊/demo 導向、各頁返回連結、sidebar 連結與 active 判斷一併更新。
- **新增 landing page**：單頁四段簡報 + 結尾行動區，延用 App 既有視覺語彙（Nunito extrabold、糖果四色、3D 陰影、白底），不另立設計系統。讀者含非技術背景（HR），內容以產品行為為主、不寫架構細節。
- **兩張資訊型 SVG**：技能樹片段（含裂開站）、記憶三狀態與複習回圈。皆為手寫 SVG 元件，不引圖表函式庫、不放截圖。
- **技術訊息只留標籤**：結尾一排技術標籤（Next.js、TypeScript、LangGraph.js…），不展開說明；架構決策留在面試口頭與 readme。
- **統計數字從 curriculum 衍生**：節點數、概念/實作比、topic 數於 build 時由 `curriculum` 算出，不寫死（現況 readme 的 26/21/5 已與資料不符，實際為 24/20/4）。
- **順帶修正**：readme 三個過期數字。
- 不做：多語（僅繁中）、部落格/文件站、CMS、聯絡表單、深色模式、OG 圖片以外的社群素材。

## Capabilities

### New Capabilities

- `landing-page`: 公開的產品簡報頁，含 demo 帳號一鍵登入入口。

### Modified Capabilities

- `skill-tree-ui`: 技能樹地圖頁由 `/` 移至 `/tree`；`/` 讓給 landing page。

## Impact

- **路由**：`src/middleware.ts`（matcher 移除 `/`、加入 `/tree`）、`src/app/page.tsx`（改 LP）、新增 `src/app/tree/page.tsx`、`src/app/landing/*`。
- **導向**：`login/actions.ts`、`login/page.tsx`、`signup/page.tsx` 導向改 `/tree`；`lesson/[slug]/page.tsx`、`review/page.tsx`、`review/[slug]/review-session.tsx` 的返回連結改 `/tree`。
- **快取**：`lesson-actions.ts` 兩處 `revalidatePath("/")` 改 `/tree`——不改的話標記已會後技能樹不會刷新。
- **導覽**：`app-sidebar.tsx` links href 改 `/tree`、active 判斷的 `/` 特例移除、LP 路徑加入 sidebar bypass。
- **metadata**：root layout 的 title 改為專案名，`/tree` 與 LP 各自 export 自己的 metadata。
- **零後端**：無 schema／API／LLM 變更，不增加 LLM 成本。
