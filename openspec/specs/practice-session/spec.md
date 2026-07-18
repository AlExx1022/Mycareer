# practice-session Specification

## Purpose

實作型節點的完整流程——出題（題目 + 起始碼 + 測試）、Sandpack 編輯與瀏覽器內跑測試、AI code review、雙軌驗收後掌握度回寫與下一步推薦。

## Requirements

### Requirement: 實作題出題與持久化

系統 SHALL 在使用者進入實作型節點時，以該節點考點為範圍由 LLM 生成一份實作題（題目說明、起始碼、Vitest 測試碼），落 DB 持久化；同一 session 內不重新生成，續作時還原題目與使用者上次的程式碼。

#### Scenario: 首次進入出題

- **WHEN** 使用者首次進入某實作型節點的課程頁
- **THEN** 系統生成題目三件套並存入 practice session，頁面呈現題目與起始碼

#### Scenario: 中斷續作

- **WHEN** 使用者離開後再次進入同一實作型節點
- **THEN** 還原既有題目與使用者上次儲存的程式碼，不重新出題、不重複計費

#### Scenario: 題目跑不起來可重出

- **WHEN** 使用者對現有題目要求重新出題
- **THEN** 刪除既有 practice session 並重新生成（計一次 LLM 限額）

#### Scenario: 未登入

- **WHEN** 無有效 session 呼叫出題或 review API
- **THEN** 回應 401，不消耗 LLM 呼叫

### Requirement: 瀏覽器內測試執行

實作題介面 SHALL 內嵌 Sandpack 編輯器與測試執行器，使用者程式碼的測試在瀏覽器內執行並即時顯示結果，不佔伺服器運算。

#### Scenario: 跑測試

- **WHEN** 使用者在編輯器修改程式碼
- **THEN** 測試在瀏覽器內執行，逐條顯示通過／失敗

#### Scenario: 測試全過解鎖送審

- **WHEN** 全部測試通過
- **THEN** 介面出現送出 AI review 的入口；未全過時不可送審

### Requirement: AI code review 與雙軌過關

系統 SHALL 在使用者送審時，由 server 端 LLM review 使用者程式碼（附題目與測試碼），回傳品質意見並判定 verdict；掌握度寫入 SHALL 以 server 端 verdict 為準，不信任 client 回報的測試結果。

#### Scenario: review 通過亮燈

- **WHEN** 送審的程式碼經 AI review 判定通過
- **THEN** server 寫入 user_lesson_mastery 達亮燈門檻，回傳 review 意見與下一個可學節點推薦

#### Scenario: review 未過不寫掌握度

- **WHEN** 送審的程式碼經 AI review 判定未通過（如與測試意圖不符）
- **THEN** 不寫入掌握度，review 意見照常回傳供使用者修改

#### Scenario: review 意見即時顯示

- **WHEN** AI review 完成
- **THEN** 意見（命名、慣用寫法、邊界情況等）顯示於題目說明側的 review 區

### Requirement: LLM 呼叫納入限額

出題與 review 的 LLM 呼叫 SHALL 納入既有的每日使用者限額計數，超額回應 429。

#### Scenario: 超額拒絕

- **WHEN** 使用者當日 LLM 呼叫數已達上限並觸發出題或 review
- **THEN** 回應 429 與友善訊息，不呼叫 LLM
