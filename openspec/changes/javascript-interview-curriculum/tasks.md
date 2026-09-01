## 1. Curriculum authoring

- [x] 1.1 建立 `javascript-interview-core.ts`，依 design 定義 5 Units、23 concept、5 practice 與完整同 path dependencies
- [x] 1.2 為 23 個 concept 人工撰寫 intro、2–3 個遞進 examPoints 與至少兩條 rubric，逐課檢查 Explain / Reason / Apply 覆蓋
- [x] 1.3 為 5 個 practice 人工撰寫 objective、requirements、edgeCases、starterSignature、timeboxMinutes、followUps，runtime 固定 `vanilla-js`
- [x] 1.4 作者人工審訂：刪除術語百科、重複 React 教學與不屬 Junior 核心的進階內容

## 2. Seed 與資料驗證

- [x] 2.1 將 JavaScript path 以 draft 加入 curricula aggregate，設定 position 與 TypeScript / React 可引用的 recommended prerequisite id
- [x] 2.2 擴充 curriculum selfcheck：精確驗證 5 / 28 / 23 / 5 數量、slug 唯一、同 path DAG、intro / rubric / blueprint 完整
- [x] 2.3 在測試 DB 執行 seed 兩次，確認冪等且 React path、mastery、weakness、sessions 筆數不變

## 3. 課程與實作抽測

- [x] 3.1 抽測 coercion、closure、event loop、fetch 四個 concept：subject / codeLanguage 正確、題目可判定、rubric 能區分背誦與理解
- [x] 3.2 跑五個 Interview Lab 的生成與 vanilla-js tests，確認 blueprint requirements / edgeCases 全被覆蓋
- [x] 3.3 對 autocomplete capstone 做瀏覽器驗收：快速輸入、abort、舊回應、HTTP error、empty state

## 4. 收尾

- [x] 4.1 更新 readme / landing 衍生統計與路徑說明，不手寫會漂移的 lesson 數字
- [x] 4.2 跑 TypeScript、eslint、selfchecks、integration tests 與 production build
- [x] 4.3 建立僅非 production 可用的 draft 試走入口，並讓 tree、lesson、API、autosave 與下一站連結維持同一 preview scope
- [x] 4.4 在 draft lesson 加入瀏覽器端試走回饋紀錄與 JSON 匯出，不新增 production 資料或 schema
- [ ] 4.5 使用者完整走完一個 Unit 並記錄過長、過淺、題目漂移問題；修正後將 path 改為 published，才開始 TypeScript curriculum change
