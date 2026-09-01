## 1. Curriculum authoring

- [ ] 1.1 建立 `python-interview-core.ts`，依 design 定義 4 Units、17 concept、5 practice 與完整同 path dependencies
- [ ] 1.2 為 17 個 concept 人工撰寫 intro、2–3 個遞進 examPoints 與至少兩條 rubric，重點驗收 Python 特有語意與 JS / TS 差異
- [ ] 1.3 為五個 Python practice 撰寫人工 blueprint，限定標準函式庫、worker timebox、edgeCases 與 Big-O / follow-up
- [ ] 1.4 完整定稿技能差距分析 CLI contract：input schemas、normalization、outputs、package layout、error cases 與 pytest cases
- [ ] 1.5 作者人工審訂，移除 backend / data science / concurrency / advanced typing / complex DSA 膨脹內容

## 2. Python runtime 課程化驗證

- [ ] 2.1 以五個正式 blueprint 驗證 Pyodide worker namespace、timeout / recreate、stdout / traceback 與 normalized tests
- [ ] 2.2 generation validation 阻擋 socket、subprocess、native-only dependency 與未策展 network 使用
- [ ] 2.3 code review prompt 改用 Python 慣例與 blueprint，不產生 React / TypeScript 建議
- [ ] 2.4 建立本機 Python 版本的 capstone fixture 與 pytest suite，驗證 browser runner 與本機結果一致的核心 cases

## 3. Seed 與課程抽測

- [ ] 3.1 將 Python path 以 draft 加入 curricula aggregate，position 排在 JavaScript、TypeScript、React 後且無 hard prerequisite
- [ ] 3.2 selfcheck 精確驗證 4 / 22 / 17 / 5 數量、slug、同 path DAG、intro / rubric / blueprint 與 Python runtime 完整
- [ ] 3.3 seed 兩次驗證冪等、其他 paths 與所有既有使用者資料隔離
- [ ] 3.4 抽測 binding、mutable default、generator、typing、testing 五個 concept 的教學與判定
- [ ] 3.5 完整跑五個 practice，包含 Python infinite loop timeout 後再次執行

## 4. 收尾

- [ ] 4.1 更新 readme / landing 衍生統計、Python runner 邊界與 capstone 本機執行說明
- [ ] 4.2 跑 TypeScript、eslint、全部 selfchecks / integration tests、production build，以及 capstone fixture 的本機 pytest
- [ ] 4.3 使用者完整走完一個 Python Unit 與 capstone mock interview；確認能口述資料結構、錯誤邊界與 Big-O 後才將路徑標為發布
