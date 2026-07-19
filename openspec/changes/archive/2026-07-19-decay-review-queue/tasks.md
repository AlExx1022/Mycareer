## 1. 衰減模型

- [x] 1.1 `src/lib/mastery-decay.ts`：`effectiveScore` 純函式（半衰期 14 天）、`CRACK_THRESHOLD = 55`、裂開推導（raw ≥ 70 且 effective < 55）＋ selfcheck（剛評估不衰減、14 天半衰、遲滯區間、裂開不鎖下游）
- [x] 1.2 技能樹查詢回傳補 effective / cracked；`deriveNodeStates` 加入 cracked 推導，解鎖 lit set 沿用 raw score

## 2. 地圖裂開視覺與入口

- [x] 2.1 `skill-tree-map.tsx` 啟用 cracked 樣式（既有預留），裂開節點可點入
- [x] 2.2 佇列非空時地圖顯示複習入口提示（含裂開數），連到 `/review`

## 3. 複習資料層

- [x] 3.1 `review_session` 表（PK userId+lessonId、questions snapshot、進度、sourceWeaknessIds、version、updatedAt），additive migration
- [x] 3.2 弱點查詢：依 user+lesson 取最近 10 筆 weakness_record 摘要（佇列顯示與出題共用）

## 4. 複習頁與 session

- [x] 4.1 `/review` 頁：裂開節點佇列（effective 低→高排序）＋各節點弱點摘要；空佇列狀態；practice 節點連回原課程頁；未登入導向登入
- [x] 4.2 複習出題 route：注入弱點摘要批次生成 3–5 題（重用 units.ts 生成 schema），無弱點退回考點；sourceWeaknessIds 落 snapshot；計 1 次額度；payload 不含正解
- [x] 4.3 複習作答：重用既有題目 widget 與判定（客觀題 server 判定、問答題 LLM 判定、答錯寫弱點）；中斷續作自 row 還原
- [x] 4.4 完成回寫：score = 70 + round(30 × 首次答對率)、assessedAt = now、刪除 review_session row；回寫僅由 server 作答記錄計算

## 5. 驗證

- [x] 5.1 selfcheck / API 層驗證：decay selfcheck、技能樹 API 含 effective/cracked、複習出題含 sourceWeaknessIds 且 payload 無正解、完成回寫分數公式、偽造完成被拒
- [x] 5.2 瀏覽器手動驗收（使用者執行）：改舊 assessedAt 讓節點裂開 → 地圖見裂開樣式與複習提示 → `/review` 佇列含弱點摘要 → 複習 session 出題打向弱點 → 完成後節點復亮
