# weakness-tracking Specification

## Purpose
TBD - created by archiving change lesson-session-core. Update Purpose after archive.
## Requirements
### Requirement: 語意級弱點記錄

系統 SHALL 在檢核判定某 rubric criterion 未通過時，寫入一筆語意級弱點記錄：使用者、節點、對應 criterion、以及一句話描述誤解本質的摘要（LLM 生成），附時間戳。記錄為 append-only。

#### Scenario: 檢核失敗寫入弱點

- **WHEN** 使用者的回答未通過某 rubric criterion
- **THEN** weakness_record 新增一筆含該 criterion 與語意摘要的記錄

#### Scenario: 檢核全過不寫入

- **WHEN** 使用者的回答通過全部 criterion
- **THEN** 不新增弱點記錄

### Requirement: 弱點記錄可查詢

系統 SHALL 提供依使用者查詢弱點記錄的能力（供後續複習佇列使用）。

#### Scenario: 查詢自己的弱點

- **WHEN** 以某使用者身分查詢弱點記錄
- **THEN** 回傳該使用者全部記錄，含節點、criterion、摘要、時間

