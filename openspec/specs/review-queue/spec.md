# review-queue Specification

## Purpose
複習頁今日佇列與弱點導向複習 session：裂開節點進佇列、出題打向歷史弱點、完成後掌握度回寫與復亮。
## Requirements
### Requirement: 今日佇列
系統 SHALL 提供複習頁 `/review`：列出當前裂開節點（依有效掌握度由低到高排序），每列附該節點的歷史弱點摘要；佇列為空時明確告知無需複習。未登入 SHALL 拒絕存取。

#### Scenario: 裂開節點進入佇列
- **WHEN** 使用者有節點處於裂開狀態
- **THEN** 複習頁列出該節點與其弱點摘要，點擊概念節點進入複習 session

#### Scenario: practice 節點導回課程頁
- **WHEN** 使用者點擊佇列中的 practice 型節點
- **THEN** 導向該節點原課程頁重做實作題，不建立複習 session

#### Scenario: 無裂開節點
- **WHEN** 使用者無任何裂開節點
- **THEN** 複習頁顯示空佇列狀態，不顯示錯誤

### Requirement: 弱點導向出題
系統 SHALL 在概念節點的複習 session 開始時，以該節點最近的弱點記錄摘要為範圍批次生成 3–5 題混合題型（重用既有題型系統），並將所依據的弱點記錄 id 隨題目 snapshot 持久化（出題可追溯）；該節點無弱點記錄時退回以考點為範圍出題。出題計一次 LLM 額度，題目 payload SHALL NOT 含正解與判定要點。

#### Scenario: 依弱點出題並可追溯
- **WHEN** 使用者對有弱點記錄的裂開節點開始複習
- **THEN** 生成題目針對弱點摘要中的誤解，session 持久化含來源弱點記錄 id

#### Scenario: 無弱點退回考點
- **WHEN** 使用者對無弱點記錄的裂開節點開始複習
- **THEN** 以該節點考點為範圍出題，複習流程照常進行

### Requirement: 複習作答與判定
複習 session SHALL 沿用既有判定機制：一次一題、客觀題 server 端即時判定不計額度、問答題 LLM 判定計額度、答錯客觀題依既有規則寫入弱點記錄。

#### Scenario: 複習中答錯累積新弱點
- **WHEN** 使用者在複習中首次答錯某客觀題
- **THEN** 寫入一筆 weakness_record（規則同課程內客觀題答錯），供下輪複習使用

#### Scenario: 中斷續作
- **WHEN** 使用者離開複習頁後再次進入同節點的複習
- **THEN** 還原題目與作答進度，不重新出題、不重計出題額度

### Requirement: 複習完成與復亮
系統 SHALL 在全部題目完成時回寫掌握度：`score = 70 + round(30 × 首次答對題數 ÷ 總題數)`、assessedAt 更新為當下，使節點脫離裂開狀態；掌握度回寫僅由 server 端複習流程觸發。完成後 SHALL 清除該複習 session，下次裂開重新出題。

#### Scenario: 完成複習後復亮
- **WHEN** 使用者完成複習 session 的全部題目
- **THEN** 掌握度依首次答對率回寫、assessedAt 更新，技能樹該節點回到亮燈狀態

#### Scenario: 偽造完成不生效
- **WHEN** client 未經 server 判定流程直接請求回寫掌握度
- **THEN** 系統拒絕——分數僅由 server 端作答記錄計算
