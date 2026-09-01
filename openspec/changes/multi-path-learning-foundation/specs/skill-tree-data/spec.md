# skill-tree-data Delta

## MODIFIED Requirements

### Requirement: 技能樹資料模型

系統 SHALL 以主題無關的 schema 儲存技能樹：Learning Path（路徑，含 title、description、subject、codeLanguage、`draft | published` status、position 與具外鍵完整性的建議前置路徑關聯）、Unit（隸屬一條 Path）、Lesson（節點，含型態 `concept` 或 `practice`、考點、過關 rubric、topic、intro、practice runtime 與人工 practice blueprint）、節點間依賴關係、以及使用者對節點的掌握度。概念節點 SHALL 不含 practice runtime；實作節點 SHALL 明確指定支援的 runtime 與 blueprint。

#### Scenario: migration 建立多路徑資料結構

- **WHEN** 執行 Drizzle migration
- **THEN** DB 具備 learning_path 與建議前置關聯，path status、unit path 外鍵與 lesson practice metadata 受允許值及完整性約束

#### Scenario: 依賴指向必須存在

- **WHEN** 寫入一筆指向不存在節點的依賴
- **THEN** DB 以外鍵約束拒絕寫入

#### Scenario: 禁止跨路徑 hard dependency

- **WHEN** curriculum 宣告 lesson 依賴另一條 path 的 lesson
- **THEN** seed selfcheck 在寫入前失敗並指出兩個 path 與 lesson

### Requirement: 課綱 seed

系統 SHALL 提供多課綱 aggregate seed，將每個人工策展的 CurriculumPath 寫入 DB；每條路徑 SHALL 各自驗證 slug 唯一、依賴存在且無循環、concept intro 完整、practice runtime 與 blueprint 完整。重複執行結果 SHALL 冪等，且 stale 資料清理 SHALL 限定在本次同步的 path，不得刪除其他 path 的 lesson 或使用者進度。

#### Scenario: 無損遷移既有 React 課綱

- **WHEN** 首次套用多路徑 migration 與 seed
- **THEN** 既有兩個 React Unit 歸入 `react-junior-mid`，24 個 lesson slug 與所有 mastery、weakness、lesson/practice/review session 關聯保持不變

#### Scenario: 重複執行 aggregate seed

- **WHEN** 對相同 curricula 再次執行 seed
- **THEN** path、unit、lesson 與 dependency 不重複，策展欄位更新為最新版

#### Scenario: 單一路徑同步隔離

- **WHEN** 更新並同步其中一條 path 的 curriculum
- **THEN** 只 prune 該 path 已移除的 unit / lesson，其他 path 及其使用者資料不變

#### Scenario: 循環依賴防呆

- **WHEN** 任一路徑含循環依賴
- **THEN** seed 在寫入前失敗並指出循環路徑

### Requirement: 技能樹查詢 API

系統 SHALL 提供 path-scoped 技能樹查詢，回傳指定 Learning Path → Unit → Lesson、同路徑依賴與當前登入使用者的掌握度；另提供路徑目錄所需的完成度摘要。查詢 SHALL NOT 為單一路徑載入或回傳其他路徑的完整 lesson 集合。

#### Scenario: 登入使用者取得指定技能樹

- **WHEN** 已登入使用者以有效 pathId 請求技能樹
- **THEN** 回傳該 Path 的 metadata、Unit、Lesson、同路徑依賴與個人掌握度

#### Scenario: 取得路徑摘要

- **WHEN** 已登入使用者請求學習路徑目錄
- **THEN** 回傳全部已發布 path 的 metadata 與完成數／總數，不回傳完整 lesson payload

#### Scenario: 未登入請求

- **WHEN** 未登入請求路徑摘要或技能樹
- **THEN** 回傳 401
