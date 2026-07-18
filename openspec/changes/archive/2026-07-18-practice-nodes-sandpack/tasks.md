## 1. 資料層

- [x] 1.1 新增 `practice_session` 表（`src/db/practice-session-schema.ts`：(userId, lessonId) PK、exercise jsonb、userCode、status、updatedAt），跑 drizzle migration
- [x] 1.2 安裝 `@codesandbox/sandpack-react`

## 2. API

- [x] 2.1 出題 endpoint `POST /api/lesson/[slug]/practice`：auth + 限額檢查、get-or-generate（`generateObject` + zod schema 生成三件套落 DB）、`regenerate` 參數支援重出題
- [x] 2.2 review endpoint `POST /api/lesson/[slug]/review`：auth + 限額檢查、結構化 review（verdict / comments / weaknesses）、pass 時寫 user_lesson_mastery + 回傳下一節點推薦、weaknesses 寫入 weakness_record
- [x] 2.3 userCode 自動儲存（review route 或獨立輕量端點，續作還原用）

## 3. UI

- [x] 3.1 課程頁 `page.tsx` 依 lesson.type 分流，concept 走既有對話元件
- [x] 3.2 `PracticeSession` client component：左題目說明（Markdown）+ review 意見區，右 Sandpack（editor + SandpackTests），react-ts template
- [x] 3.3 測試全過解鎖「送出 review」按鈕；review 結果即時顯示；pass 後顯示過關與下一節點連結
- [x] 3.4 「重新出題」入口與確認提示

## 4. 驗證

- [x] 4.1 出題/review 結構化輸出的 zod schema self-check（仿 `skill-tree.selfcheck.ts` 模式）
- [x] 4.2 手動驗收：完整走完一個實作型節點（寫 debounce 類題目）→ 測試瀏覽器內全過 → review 意見顯示 → 樹上亮燈、weakness 有記錄
- [x] 4.3 驗證未登入 401、超額 429、client 偽造測試結果不寫掌握度
