# Design: skill-tree-ui

## Context

C1 提供 `GET /api/skill-tree`（Unit → Lesson 樹 + 依賴 + 個人掌握度）。C2 把它畫成技能樹地圖並開放「手動標記已會」。裂開狀態的觸發（衰減）是 C5 範圍，這裡只先把視覺做出來。

## Goals / Non-Goals

**Goals:**

- 登入後首頁即技能樹，節點狀態正確反映掌握度與依賴。
- GSAP 動畫（進場、狀態轉換、hover）。
- 手動標記/取消「已會」，立即反映在樹上（含解鎖下游節點）。
- 節點點擊導向 `/lesson/[slug]`（placeholder 頁，C3 填內容）。

**Non-Goals:**

- 課程頁內容與學習 session（C3）、衰減與裂開的觸發邏輯（C5）。
- 拖曳、縮放、平移等地圖操作——12 節點一屏放得下。
- 手機版深度優化——responsive 不爛掉即可，demo 主場景是桌機。

## Decisions

1. **節點狀態在前端推導，不落庫**
   - `lit`：score ≥ 70（門檻先做成常數 `MASTERY_THRESHOLD`，C3/C5 沿用）；`locked`：任一依賴未 lit；`available`：其餘；`cracked`：推導條件留給 C5，本次僅實作視覺樣式（可用 Storybook 式的假資料驗看）。
   - 推導邏輯抽到 `src/lib/skill-tree.ts`（純函式），C5 改門檻/加衰減時只動這一處。

2. **Layout 用拓撲分層 + CSS grid，依賴連線用 SVG overlay**
   - 每個 Unit 一個區塊；區塊內以 BFS 算節點的拓撲層級（layer = 最長依賴鏈深度），同層橫排。
   - 連線：節點定位後用一層 `<svg>` 畫貝茲曲線，座標由 `getBoundingClientRect` 取得（resize 時重算）。
   - 不引入圖形庫（react-flow 等）——12 節點的靜態 DAG 用不到，且自刻更能展示前端功力。

3. **Server Component 拿資料，Client Component 畫樹**
   - 首頁（server）直接呼叫共用查詢函式拿樹資料傳給 `<SkillTree>`（client，GSAP 需要）。
   - 把 C1 route.ts 裡的組樹邏輯抽成 `getSkillTreeForUser(userId)`（`src/db/queries/skill-tree.ts`），API route 與首頁共用，避免兩份組樹程式碼。

4. **手動標記走 Server Action，不加新 API route**
   - `markLessonKnown(slug)` / `unmarkLessonKnown(slug)`：upsert / delete `user_lesson_mastery`（score=100、assessedAt=now）+ `revalidatePath("/")`。
   - 專案已有 server action 前例（demoLogin）；標記後整樹狀態重推導由 re-render 完成。
   - 標記已會 SHALL 僅允許標記在自己身上（action 內驗 session）。

5. **GSAP 用 `useGSAP` hook（@gsap/react）**
   - 進場：Unit 區塊與節點 stagger fade-in + scale。
   - 狀態轉換：標記已會時該節點亮燈動畫 + 被解鎖的下游節點從 locked 樣式過渡。
   - `prefers-reduced-motion` 用 `gsap.matchMedia()` 尊重。

## Risks / Trade-offs

- [SVG 連線座標依賴 DOM 佈局，字型載入/resize 會位移] → ResizeObserver 重算；曲線掛在同一個相對定位容器內，捲動不受影響。
- [裂開狀態沒有真實資料可看] → 開發時用假資料目測 + 樣式留在元件內；C5 接上即生效。
- [首頁與 API 共用查詢後，API 行為必須不變] → 抽取是純搬移，回傳 shape 不動，抽完跑一次 C1 的驗證（401 + demo 樹）。

## Open Questions

- 無。視覺方向（配色、節點形狀）實作時依現有 Tailwind 風格決定，不阻塞。
