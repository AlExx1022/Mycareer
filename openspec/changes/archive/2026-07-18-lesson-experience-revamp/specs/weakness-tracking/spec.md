# weakness-tracking Delta

## ADDED Requirements

### Requirement: 客觀題答錯弱點來源

系統 SHALL 在使用者答錯客觀題時，寫入與既有格式一致的 weakness_record（使用者、節點、criterion 為對應考點、一句話摘要、時間戳）；同一題重複答錯不重複寫入。

#### Scenario: 首次答錯寫入

- **WHEN** 使用者對某客觀題首次作答錯誤
- **THEN** weakness_record 新增一筆，criterion 為該題對應考點，摘要描述誤解內容

#### Scenario: 重複答錯不重複寫入

- **WHEN** 使用者對同一題再次作答錯誤
- **THEN** 不新增弱點記錄
