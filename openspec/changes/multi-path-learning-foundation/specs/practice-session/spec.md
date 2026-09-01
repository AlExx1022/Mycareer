# practice-session Delta

## MODIFIED Requirements

### Requirement: 實作題出題與持久化

系統 SHALL 在使用者進入實作型節點時，以該 lesson 的 subject、codeLanguage、practiceRuntime、examPoints、rubric 與人工 practiceBlueprint 為範圍，由 LLM 生成一份符合 runtime 的 versioned multi-file workspace（題目說明、entry file、starter / test / setup files），落 DB 持久化；同一 session 內不重新生成，續作時還原題目、檔案與使用者上次的程式碼。生成結果 SHALL 涵蓋 blueprint 指定的 requirements 與 edgeCases，不得改變核心 objective。

#### Scenario: 首次進入出題

- **WHEN** 使用者首次進入具有完整 runtime 與 blueprint 的實作 lesson
- **THEN** 系統以正確語言生成 workspace 並存入 practice session，頁面呈現題目、可編輯 starter files 與唯讀 test / setup files

#### Scenario: 舊 React practice session 續作

- **WHEN** 系統讀到既有 `{ description, starterCode, testCode }` practice payload
- **THEN** react-ts adapter 將其映射為新版 workspace，將既有 userCode 放入 entry file，不要求重出題或清除進度

#### Scenario: 多檔案自動儲存

- **WHEN** 使用者修改 workspace 中任一可編輯檔案
- **THEN** 系統 debounce 後將全部 editable file contents 存入 practice session 的 userFiles，續作時逐檔還原

#### Scenario: 缺少實作 metadata

- **WHEN** practice lesson 缺少 runtime 或 blueprint
- **THEN** seed selfcheck 拒絕該 curriculum；runtime 不支援時 API 回傳可診斷錯誤且不呼叫 LLM

#### Scenario: 中斷續作

- **WHEN** 使用者離開後再次進入同一實作型節點
- **THEN** 還原既有題目與使用者上次儲存的程式碼，不重新出題、不重複計費

#### Scenario: 題目跑不起來可重出

- **WHEN** 使用者對現有題目要求重新出題
- **THEN** 刪除既有 practice session 並依相同 blueprint 重新生成（計一次 LLM 限額）

#### Scenario: 未登入

- **WHEN** 無有效 session 呼叫出題或 review API
- **THEN** 回應 401，不消耗 LLM 呼叫

### Requirement: 瀏覽器內測試執行

實作題介面 SHALL 依 practiceRuntime 選擇 runner adapter，支援 `react-ts`、`vanilla-ts`、`vanilla-js` 與 `python`，並將結果正規化為 compile diagnostics、逐條通過／失敗與 runtime error。所有使用者程式碼 SHALL 在瀏覽器 sandbox 或 Web Worker 執行，不得由 application server eval。

#### Scenario: JavaScript／TypeScript 跑測試

- **WHEN** 使用者修改 react-ts、vanilla-ts 或 vanilla-js 實作程式碼
- **THEN** Sandpack 使用對應 template 與 workspace 檔案執行 typecheck / tests，逐條顯示 diagnostics 與測試結果

#### Scenario: Python 跑測試

- **WHEN** 使用者修改 python 實作程式碼
- **THEN** Pyodide 在 Web Worker 的獨立 namespace 執行程式與測試，UI 保持可操作並顯示正規化結果

#### Scenario: Python 執行逾時

- **WHEN** Python 程式超過設定的執行上限
- **THEN** 系統終止並重建 worker、回報逾時，且不影響 application server 或其他使用者

#### Scenario: 測試全過解鎖送審

- **WHEN** 目前 runtime adapter 回報無 compile diagnostics 且全部測試通過
- **THEN** 介面出現送出 AI review 的入口；未全過時不可送審

### Requirement: AI code review 與雙軌過關

系統 SHALL 在使用者送審時，由 server 端 LLM 依 lesson 的 subject、codeLanguage、rubric 與 practiceBlueprint review 使用者程式碼，回傳品質意見並判定 verdict；掌握度寫入 SHALL 以 server 端 verdict 為準，不信任 client 回報的測試結果。

#### Scenario: review 使用正確語言上下文

- **WHEN** 使用者送審任一支援 runtime 的程式碼
- **THEN** code review 使用該 lesson 的語言慣例、blueprint 與 rubric，不套用 React／TypeScript 固定規則

#### Scenario: review 通過亮燈

- **WHEN** 送審的程式碼經 AI review 判定通過
- **THEN** server 寫入 user_lesson_mastery 達亮燈門檻，回傳 review 意見與同 path 的下一個可學節點推薦

#### Scenario: review 未過不寫掌握度

- **WHEN** 送審的程式碼經 AI review 判定未通過
- **THEN** 不寫入掌握度，review 意見照常回傳供使用者修改

#### Scenario: review 意見即時顯示

- **WHEN** AI review 完成
- **THEN** 意見顯示於題目說明側的 review 區
