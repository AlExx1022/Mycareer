# skill-tree-data Specification

## Purpose
TBD - created by archiving change skill-tree-data. Update Purpose after archive.
## Requirements
### Requirement: 技能樹資料模型
系統 SHALL 以主題無關的 schema 儲存技能樹：Unit（單元）、Lesson（節點，含型態 `concept` 或 `practice`、考點、過關 rubric、主題標籤 topic、課前導入 intro）、節點間依賴關係、以及使用者對節點的掌握度（分數與評估時間）。概念節點的 intro SHALL 為結構化欄位：hook（為什麼學）、scenarios（實際應用場景）、outcome（學完能做什麼）。

#### Scenario: migration 建立資料結構
- **WHEN** 執行 Drizzle migration
- **THEN** DB 具備 unit、lesson、lesson_dependency、user_lesson_mastery 四張表，lesson 型態僅允許 `concept` 或 `practice`，且 lesson 具備 intro 與 topic 欄位（additive migration）

#### Scenario: 依賴指向必須存在
- **WHEN** 寫入一筆指向不存在節點的依賴
- **THEN** DB 以外鍵約束拒絕寫入

### Requirement: 課綱 seed
系統 SHALL 提供 seed script，將人工策展的「React Junior → Mid」路徑寫入 DB：一節點一概念（約 30 個節點），每個概念節點含課前導入 intro、依難度遞進排序的 2–3 個考點（直覺認識 → 原理理解 → 深入/誤解）、rubric 與主題標籤 topic，同 topic 節點以依賴串成鏈；重複執行結果一致（冪等）。

#### Scenario: 初次 seed
- **WHEN** 對空 DB 執行 seed script
- **THEN** DB 內有完整 Unit 與約 30 個節點，每個概念節點含 intro、依難度排序的考點、rubric、topic 與依賴資料

#### Scenario: 重複執行 seed
- **WHEN** 再次執行 seed script
- **THEN** 資料不重複、更新後的課綱內容以最新版為準

#### Scenario: 循環依賴防呆
- **WHEN** 課綱資料檔含循環依賴
- **THEN** seed script 失敗並指出循環所在，不寫入資料

#### Scenario: 重策展後舊進度作廢
- **WHEN** 以新版課綱（slug 全面更換）執行 seed
- **THEN** 舊 slug 節點及其掌握度、弱點、session 紀錄一併清除，不留孤兒資料

### Requirement: 技能樹查詢 API
系統 SHALL 提供 API，回傳含依賴關係的完整樹狀結構，並附上當前登入使用者的每節點掌握度。

#### Scenario: 登入使用者取得技能樹
- **WHEN** 已登入使用者請求技能樹 API
- **THEN** 回傳 Unit → Lesson 的樹狀結構，每個 Lesson 含型態、topic、依賴節點列表、與該使用者的掌握度（未評估則為空）

#### Scenario: 未登入請求
- **WHEN** 未登入請求技能樹 API
- **THEN** 回傳 401

