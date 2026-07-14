# lesson-session Delta

## ADDED Requirements

### Requirement: 課程頁依節點型別分流

課程頁 SHALL 依 lesson.type 分流：concept 節點呈現對話 session 介面，practice 節點呈現實作題介面（見 practice-session capability）。

#### Scenario: 概念型節點

- **WHEN** 使用者進入 type 為 concept 的節點課程頁
- **THEN** 呈現既有的 streaming 對話學習循環

#### Scenario: 實作型節點

- **WHEN** 使用者進入 type 為 practice 的節點課程頁
- **THEN** 呈現實作題介面（題目說明 + Sandpack 編輯器），不建立對話 session
