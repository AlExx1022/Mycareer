# lesson-session Specification

## Purpose
TBD - created by archiving change lesson-session-core. Update Purpose after archive.
## Requirements
### Requirement: 課程 session 狀態機

系統 SHALL 以 LangGraph.js 狀態機驅動概念型節點的學習 session：教學 → 蘇格拉底檢核 → 答錯換角度再教 → 全部 rubric 通過後結束。檢核 SHALL 以該節點的 rubric（criterion 與 passCondition）為判定依據。

#### Scenario: 開始上課

- **WHEN** 使用者在概念型節點的課程頁送出第一則訊息（或開啟課程）
- **THEN** AI 以該節點考點為範圍開始教學，並建立 session 狀態

#### Scenario: 檢核通過

- **WHEN** 使用者的回答滿足全部 rubric criterion 的 passCondition
- **THEN** session 進入結束狀態，告知使用者過關

#### Scenario: 檢核未過換角度再教

- **WHEN** 使用者的回答未滿足某些 rubric criterion
- **THEN** AI 針對未通過的 criterion 以不同角度重新教學並再次檢核，不直接給答案

#### Scenario: session 可中斷續聊

- **WHEN** 使用者離開課程頁後再次進入同一節點
- **THEN** 對話歷史與檢核進度自 DB 還原，從中斷處繼續

### Requirement: streaming 對話 UI

課程頁 SHALL 以 streaming 對話介面呈現 session，AI 回覆逐 token 顯示。

#### Scenario: 逐 token 顯示

- **WHEN** AI 產生回覆
- **THEN** 內容以 stream 方式即時渲染，而非等待完整回覆

#### Scenario: 未登入

- **WHEN** 無有效 session 呼叫課程對話 API
- **THEN** 回應 401，不消耗 LLM 呼叫

### Requirement: 掌握度回寫與亮燈

系統 SHALL 在檢核通過時將該節點掌握度寫入 user_lesson_mastery（分數達亮燈門檻），使技能樹該節點亮燈。

#### Scenario: 過關後亮燈

- **WHEN** 使用者完成某概念型節點的檢核
- **THEN** user_lesson_mastery 寫入該節點達門檻分數，回到技能樹該節點呈亮燈狀態

#### Scenario: 掌握度由 server 判定

- **WHEN** client 直接請求寫入掌握度而未經檢核通過
- **THEN** 系統拒絕——掌握度更新僅由 server 端檢核流程觸發（手動標記已會除外）

### Requirement: 下一步推薦

系統 SHALL 在檢核通過後推薦下一個可學節點（依技能樹依賴關係），並提供入口連結。

#### Scenario: 過關後推薦

- **WHEN** 使用者完成節點檢核
- **THEN** 結束訊息包含下一個可學節點的推薦與連結；若無可學節點則明確告知

