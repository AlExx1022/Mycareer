# llm-usage-limit Specification

## Purpose
TBD - created by archiving change lesson-session-core. Update Purpose after archive.
## Requirements
### Requirement: 使用者級 LLM 呼叫限額

系統 SHALL 對每位使用者施加每日 LLM 呼叫次數上限（環境變數設定，預設 50）。每次課程對話請求 SHALL 先原子遞增當日計數並檢查上限，超額時拒絕請求且不呼叫 LLM。

#### Scenario: 額度內正常使用

- **WHEN** 使用者當日呼叫次數未達上限
- **THEN** 請求正常處理，計數 +1

#### Scenario: 超額拒絕

- **WHEN** 使用者當日呼叫次數已達上限
- **THEN** 回應 429 與友善訊息，不發生任何 LLM 呼叫

#### Scenario: 跨日重置

- **WHEN** 進入新的一天
- **THEN** 該使用者計數自 0 起算

