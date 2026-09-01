# javascript-interview-curriculum Specification

## ADDED Requirements

### Requirement: JavaScript Junior 面試核心路徑

系統 SHALL 提供 `javascript-interview-core` 學習路徑，包含 5 個依序解鎖的 Unit 與 28 個 Lesson（23 concept、5 practice），範圍依序涵蓋值與比較、Scope / Function / this、資料處理與 Object Model、非同步 JavaScript、Browser Integration。

#### Scenario: 初次 seed JavaScript 路徑

- **WHEN** 在完成 multi-path foundation 的環境執行 curricula aggregate seed
- **THEN** DB 新增完整 JavaScript path、5 Units、28 Lessons 與同 path dependencies，既有 React path 與使用者資料不變

#### Scenario: 路徑順序

- **WHEN** 使用者首次進入 JavaScript 路徑且尚無 mastery
- **THEN** 值與型別的第一個節點可學，其餘節點依 Unit 主鏈與 practice checkpoint 狀態解鎖

### Requirement: 面試導向 concept 驗收

JavaScript concept lesson SHALL 為一節點一概念，包含人工 intro、2–3 個由基礎到陷阱的 examPoints，以及至少兩條 rubric；整條路徑的 rubric SHALL 覆蓋口頭解釋、讀碼推理與 debug / 選型能力，不得只驗收術語定義。

#### Scenario: Scope 類節點檢核

- **WHEN** 使用者學習 hoisting、closure 或 this 類 concept
- **THEN** 題目要求預測程式行為並解釋機制，rubric 不以背出名詞作為唯一過關條件

#### Scenario: API 選擇類節點檢核

- **WHEN** 使用者學習 Array methods、Map / Set、Promise composition 或 fetch
- **THEN** 題目包含需求或 edge case，要求選擇 API 並說明 trade-off

### Requirement: JavaScript Interview Labs

JavaScript 路徑 SHALL 提供五個以人工 practiceBlueprint 策展的實作節點：值與比較輸出推理、Closure / this Debug、資料正規化與 groupBy、Promise 批次請求、Autocomplete capstone。每題 SHALL 有時限、需求、edge cases、測試與 follow-up，並使用 `vanilla-js` runtime。

#### Scenario: 實作題不偏離 archetype

- **WHEN** LLM 為任一 JavaScript practice 產生題目變體
- **THEN** 題目保留 blueprint 的 objective、函式或 UI contract、edge cases 與 timebox，不改成無關演算法題

#### Scenario: Autocomplete capstone

- **WHEN** 使用者進入 JavaScript 最後一個 practice
- **THEN** 題目要求整合 DOM event、debounce、fetch 狀態、AbortController 與 latest-request-wins，測試至少涵蓋快速連續輸入與錯誤回應

### Requirement: JavaScript 課綱範圍限制

核心路徑 SHALL NOT 為 Proxy / Reflect、WeakRef、TypedArray、engine JIT / GC、完整 Promise/A+、進階 metaprogramming 或複雜 DSA 建立節點；現代 built-ins SHALL 放入最相關 concept 的 examPoint，而非僅因版本新而獨立成課。

#### Scenario: 課綱內容審查

- **WHEN** curriculum selfcheck 或人工 review 發現 lesson 不在定義的 5 Unit 核心範圍
- **THEN** 該 lesson 不得併入本路徑，改列後續延伸 change 候選

