## 1. 基底修正

- [x] 1.1 `globals.css` 移除 dark media query，body 定死 `#F5F7F6`/`#17242D`、字體改用 Geist 變數；`layout.tsx` metadata 換產品名與一句話
- [x] 1.2 `lesson/[slug]/page.tsx` 補底色，確認全頁面深色模式下無黑底黑字（body 全域底色後自動成立，深色卡片皆已明確 text-white）

## 2. 技能樹直立式

- [x] 2.1 `layoutSkillTree` 改單線縱列：站點沿中央路線由上往下（拓撲層排序）、Unit 帶縱向堆疊、topic strip 縱向包絡；selfcheck 斷言更新
- [x] 2.2 `skill-tree-map.tsx`：站名移至圓圈右側、相鄰站直線／跨站依賴左彎貝茲、content 寬 320px 桌機置中、進場動畫參數微調；手機寬無橫向溢出

## 3. 全站一致性（frontend-design skill）

- [x] 3.1 統一頁面容器/header/返回連結/按鈕與卡片樣式（地圖、課程頁、複習兩頁）
- [x] 3.2 login/signup 對齊主配色，login 頁加一句話產品說明（landing）

## 4. 驗證

- [x] 4.1 selfcheck / build / lint 全過；`npm run build` 無新警告
- [ ] 4.2 瀏覽器手動驗收（使用者執行）：手機寬度直向捲動看完整技能樹；系統深色模式下各頁無黑底黑字；各頁觀感一致
