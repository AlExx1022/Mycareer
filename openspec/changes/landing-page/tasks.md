## 1. 路由搬遷（獨立驗收，完成後才動 LP）

- [x] 1.1 `src/app/page.tsx` 平移到 `src/app/tree/page.tsx`（內容不動），並 export 技能樹自己的 metadata
- [x] 1.2 `src/middleware.ts` matcher：移除 `/`、加入 `/tree`
- [x] 1.3 導向改 `/tree`：`login/actions.ts` 的 `demoLogin`、`login/page.tsx`、`signup/page.tsx`
- [x] 1.4 返回連結改 `/tree`：`lesson/[slug]/page.tsx`、`review/page.tsx`、`review/[slug]/review-session.tsx`
- [x] 1.5 `lesson-actions.ts` 兩處 `revalidatePath("/")` 改 `/tree`
- [x] 1.6 `app-sidebar.tsx`：links href 改 `/tree`、移除 active 判斷的 `/` 特例、`/` 加入 sidebar bypass（與 `/login`、`/signup` 同）
- [x] 1.7 `layout.tsx` metadata 改為專案層級標題
- [x] 1.8 驗收：`tsc` / `eslint` / `build` 全過；`grep -rn 'href="/"\|redirect("/")\|revalidatePath("/")' src` 無殘留

## 2. LP 骨架與內容

- [x] 2.1 `landing/content.ts`：六段文案、四色 hex、由 `curriculum` 衍生的統計（units / lessons / concept / practice / topics）
- [x] 2.2 `landing/spine.tsx`：貫穿全頁的蜿蜒路線 + 六個站，ScrollTrigger 捲動亮燈，`matchMedia` 降級為靜態全亮
- [x] 2.3 `src/app/page.tsx` 改為 LP 組裝（server component）+ LP metadata（title / description / OG）
- [x] 2.4 四段 section 元件 + 結尾行動區：L01 在做什麼與 CTA、L02 為什麼需要、L03 怎麼學、L04 它怎麼記得你、終點站（demo 入口 + 技術標籤）
- [x] 2.6 面向非技術讀者改寫：拿掉架構段落與術語，段落標題改左欄黏頂、內容吃滿寬度
- [x] 2.5 demo 一鍵登入接上既有 `demoLogin` server action，失敗時顯示可讀錯誤；次要 CTA 連 GitHub

## 3. 兩張 SVG

- [x] 3.1 `diagram-tree.tsx`：技能樹片段，含已學會／目前位置／裂開／未解鎖四態與文字標註
- [x] 3.2 `diagram-memory.tsx`：記憶三狀態（學會了 → 一陣子沒碰 → 裂開了）+ 複習清單 + 複習通過重新亮燈的回圈

## 4. 收尾

- [x] 4.1 readme 過期數字修正（26/21/5 → 依 curriculum 實際值），補上 LP 網址說明
- [x] 4.2 `tsc` / `eslint` / `build` 全過；LP 無橫向溢出，手機寬度可讀
- [ ] 4.3 瀏覽器手動驗收（使用者執行）：未登入開根網址看到 LP、demo 一鍵進站、系統開啟減少動態時頁面仍完整可讀
