# Tasks: skill-tree-ui

## 1. 資料層抽取

- [x] 1.1 把組樹邏輯從 `api/skill-tree/route.ts` 抽成 `getSkillTreeForUser(userId)`（`src/db/queries/skill-tree.ts`），route 改用，重跑 C1 驗證（401 + demo 樹）確認行為不變
- [x] 1.2 `src/lib/skill-tree.ts`：節點狀態推導純函式（lit / locked / available，門檻常數）+ 拓撲分層函式，附最小 self-check

## 2. 標記已會

- [x] 2.1 Server actions：`markLessonKnown` / `unmarkLessonKnown`（session 驗證、upsert/delete mastery、revalidate）

## 3. 技能樹 UI

- [x] 3.1 安裝 gsap + @gsap/react；首頁改為 server 取數 + `<SkillTree>` client 元件
- [x] 3.2 Unit 分區 + 拓撲分層排版 + 節點四態樣式（含裂開的視覺）
- [x] 3.3 SVG 依賴連線（座標由 layout 純函式計算，非 DOM 量測，無需 ResizeObserver）
- [x] 3.4 GSAP：進場 stagger、標記後亮燈/解鎖轉場、hover；`gsap.matchMedia()` 處理 reduced-motion
- [x] 3.5 節點互動：非上鎖節點點擊導向 `/lesson/[slug]`（placeholder 頁）、標記/取消已會的 UI

## 4. 驗收

- [x] 4.1 本地：demo 帳號標記數個節點 → 亮燈與下游解鎖正確、取消標記回退正確
- [ ] 4.2 部署後 production 走一遍：登入看到樹、標記已會即時反映
