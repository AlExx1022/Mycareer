# learning-paths Specification

## ADDED Requirements

### Requirement: 學習路徑目錄

系統 SHALL 在 `/tree` 顯示所有已發布學習路徑；每條路徑包含標題、說明、主題、完成節點數、總節點數與進入路徑的入口。路徑 SHALL 依策展 position 排序。

#### Scenario: 瀏覽路徑目錄

- **WHEN** 已登入使用者開啟 `/tree`
- **THEN** 系統列出全部已發布路徑及該使用者的完成進度，且不在同一頁渲染各路徑的完整技能樹

#### Scenario: 未登入瀏覽路徑目錄

- **WHEN** 未登入使用者開啟 `/tree`
- **THEN** 系統導向登入頁

### Requirement: 路徑範圍導覽

系統 SHALL 在 `/tree/[pathId]` 顯示指定路徑的技能樹，且 lesson 頁的返回入口 SHALL 導回該 lesson 所屬路徑。不存在的 path SHALL 回傳 404。

#### Scenario: 進入指定路徑

- **WHEN** 已登入使用者由路徑目錄選擇一條已發布路徑
- **THEN** 系統只顯示該路徑的 Unit、Lesson、依賴與個人掌握度

#### Scenario: Lesson 返回所屬路徑

- **WHEN** 使用者從任一 lesson 頁點擊返回技能樹
- **THEN** 系統導向 `/tree/[該 lesson 的 pathId]`

#### Scenario: 未知路徑

- **WHEN** 使用者開啟不存在的 `/tree/[pathId]`
- **THEN** 系統回傳 404，不退回其他路徑

#### Scenario: 草稿路徑不公開

- **WHEN** 一條 path 的 status 為 draft
- **THEN** 一般使用者的 `/tree` 目錄不顯示該 path，直接開啟其 URL 亦回傳 404

### Requirement: 路徑完成度與建議前置

系統 SHALL 以 raw mastery 達亮燈門檻的節點數計算路徑完成度；路徑可列出其他路徑作為建議前置，但建議前置 SHALL NOT 鎖住目前路徑節點。

#### Scenario: 裂開節點仍算曾完成

- **WHEN** 某節點 raw mastery 已達門檻但有效掌握度已裂開
- **THEN** 路徑目錄仍將該節點計入完成數，並由既有複習佇列提示需複習

#### Scenario: 未完成建議前置

- **WHEN** 使用者進入一條尚未完成建議前置的路徑
- **THEN** 系統顯示前置建議，但仍允許使用者進入該路徑的可學節點

### Requirement: 路徑內下一站推薦

系統 SHALL 在 lesson 過關後只從相同 path 的節點中推薦下一個可學節點；目前 path 已無下一站時 SHALL 告知該路徑完成，不得跳到其他 path。

#### Scenario: 推薦同路徑下一站

- **WHEN** 使用者完成某 lesson 且同 path 仍有可學節點
- **THEN** 系統回傳同 path 的下一個可學節點及連結

#### Scenario: 完成整條路徑

- **WHEN** 使用者完成某 lesson 且同 path 已無可學節點
- **THEN** 系統告知目前路徑完成並提供返回路徑目錄入口
