# lesson-session Specification

## Purpose
TBD - created by archiving change lesson-session-core. Update Purpose after archive.
## Requirements
### Requirement: 課程頁依節點型別分流

課程頁 SHALL 依 lesson.type 分流：concept 節點呈現對話 session 介面，practice 節點呈現實作題介面（見 practice-session capability）。

#### Scenario: 概念型節點

- **WHEN** 使用者進入 type 為 concept 的節點課程頁
- **THEN** 呈現既有的 streaming 對話學習循環

#### Scenario: 實作型節點

- **WHEN** 使用者進入 type 為 practice 的節點課程頁
- **THEN** 呈現實作題介面（題目說明 + Sandpack 編輯器），不建立對話 session

### Requirement: 小單元制學習流程

概念型節點的學習流程 SHALL 以考點為單位拆成小單元：每單元依序為「短教學 → 3–5 題互動題 → 單元完成回饋」，介面呈現單元進度；全部單元完成後進入 rubric 檢核收尾。單元教學訊息 SHALL 輕量（150 字內），互動題 SHALL 一次只呈現一題，答對才推進下一題。

#### Scenario: 一次一題

- **WHEN** 使用者在單元內作答
- **THEN** 畫面僅呈現當前一題；答對後才出現下一題，答錯可就地重答

#### Scenario: 單元推進

- **WHEN** 使用者完成某單元的全部題目
- **THEN** 呈現單元完成回饋（含進度更新），並進入下一單元的教學；已是最後一個單元時進入 rubric 檢核收尾

#### Scenario: 單元進度續作

- **WHEN** 使用者離開課程頁後再次進入同一節點
- **THEN** 還原單元進度、已生成題目與作答結果，從中斷處繼續，不重新出題

### Requirement: 混合題型出題

系統 SHALL 在進入單元時以該單元考點為範圍，由 LLM 一次批次生成 3–5 題（選擇、填空、配對、問答混合，含正解／判定要點與解析），落 session 持久化；適合的考點 SHALL 以題幹帶程式碼的選擇/填空呈現讀碼/補碼題。同單元不重複生成，出題計一次 LLM 額度。

#### Scenario: 進入單元出題

- **WHEN** 使用者進入某單元
- **THEN** 該單元題目批次生成並持久化，逐題呈現對應的互動 widget

#### Scenario: 題目不含答案下發

- **WHEN** 題目傳送至 client
- **THEN** payload 不含正解、判定要點與解析——判定所需資訊僅存於 server 端

### Requirement: 客觀題即時判定

系統 SHALL 對客觀題（選擇、填空、配對）在 server 端比對正解即時判定，不經 LLM、不計額度；答錯時回傳預生成的解析。

#### Scenario: 答對

- **WHEN** 使用者作答與正解相符
- **THEN** 即時顯示答對回饋並推進到下一題

#### Scenario: 答錯顯示解析

- **WHEN** 使用者作答與正解不符
- **THEN** 即時顯示答錯與解析，該題可再作答；答錯不消耗 LLM 額度

#### Scenario: 偽造作答不影響判定

- **WHEN** client 直接回報「答對」而未經 server 比對
- **THEN** 判定結果不受影響——對錯僅由 server 端比對決定

### Requirement: 問答題判定

系統 SHALL 對單元內的問答題以 LLM 對照該題判定要點即時判定對錯並回傳一句回饋，判定計一次 LLM 額度。

#### Scenario: 問答題作答

- **WHEN** 使用者對問答題送出自由文字回答
- **THEN** server 端 LLM 對照判定要點回傳對錯與一句回饋；答錯可重答

### Requirement: 課程 session 狀態機

系統 SHALL 以 LangGraph.js 狀態機驅動概念型節點的收尾檢核：全部小單元完成後進入蘇格拉底檢核 → 答錯換角度再教 → 全部 rubric 通過後結束。檢核 SHALL 以該節點的 rubric（criterion 與 passCondition）為判定依據；單元內的客觀題成績不作為過關依據。

#### Scenario: 開始上課

- **WHEN** 使用者在概念型節點的課程頁開啟課程
- **THEN** AI 以第一個單元的考點為範圍開始短教學，並建立 session 狀態

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

