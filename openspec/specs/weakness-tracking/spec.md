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

### Requirement: 客觀題答錯弱點來源

系統 SHALL 在使用者答錯客觀題時，寫入與既有格式一致的 weakness_record（使用者、節點、criterion 為對應考點、一句話摘要、時間戳）；同一題重複答錯不重複寫入。

#### Scenario: 首次答錯寫入

- **WHEN** 使用者對某客觀題首次作答錯誤
- **THEN** weakness_record 新增一筆，criterion 為該題對應考點，摘要描述誤解內容

#### Scenario: 重複答錯不重複寫入

- **WHEN** 使用者對同一題再次作答錯誤
- **THEN** 不新增弱點記錄

### Requirement: code review 弱點來源

系統 SHALL 在實作題 AI review 發現弱點時，寫入與檢核弱點同格式的 weakness_record（使用者、節點、criterion、語意摘要、時間戳），供複習佇列統一讀取。

#### Scenario: review 發現弱點寫入

- **WHEN** AI review 對送審程式碼指出弱點（如邊界情況遺漏）
- **THEN** weakness_record 新增對應記錄，格式與概念檢核弱點一致

#### Scenario: review 無弱點不寫入

- **WHEN** AI review 通過且無弱點意見
- **THEN** 不新增弱點記錄

### Requirement: 弱點記錄可查詢

系統 SHALL 提供依使用者查詢弱點記錄的能力（供後續複習佇列使用）。

#### Scenario: 查詢自己的弱點

- **WHEN** 以某使用者身分查詢弱點記錄
- **THEN** 回傳該使用者全部記錄，含節點、criterion、摘要、時間

