# weakness-tracking Delta

## ADDED Requirements

### Requirement: code review 弱點來源

系統 SHALL 在實作題 AI review 發現弱點時，寫入與檢核弱點同格式的 weakness_record（使用者、節點、criterion、語意摘要、時間戳），供複習佇列統一讀取。

#### Scenario: review 發現弱點寫入

- **WHEN** AI review 對送審程式碼指出弱點（如邊界情況遺漏）
- **THEN** weakness_record 新增對應記錄，格式與概念檢核弱點一致

#### Scenario: review 無弱點不寫入

- **WHEN** AI review 通過且無弱點意見
- **THEN** 不新增弱點記錄
