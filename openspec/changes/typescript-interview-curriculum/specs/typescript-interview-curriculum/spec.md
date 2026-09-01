# typescript-interview-curriculum Specification

## ADDED Requirements

### Requirement: TypeScript Junior Frontend 核心路徑

系統 SHALL 提供 `typescript-frontend-core` 學習路徑，包含 3 個依序解鎖的 Unit 與 18 個 Lesson（15 concept、3 practice），範圍依序涵蓋型別系統心智模型、資料形狀與狀態建模、衍生型別與 React 邊界。JavaScript path SHALL 為建議前置但不作 hard lock。

#### Scenario: 初次 seed TypeScript 路徑

- **WHEN** 在 JavaScript curriculum 驗收後執行 curricula aggregate seed
- **THEN** DB 新增 TypeScript path、3 Units、18 Lessons 與同 path dependencies，既有路徑與使用者資料不變

#### Scenario: 未完成 JavaScript 建議前置

- **WHEN** 使用者未完成 JavaScript path 而進入 TypeScript path
- **THEN** 系統顯示建議前置但允許開始第一個 TypeScript lesson

### Requirement: Compile-time 與 runtime 邊界

TypeScript 課程 SHALL 明確驗收型別擦除、assertion 不驗證資料、`unknown` narrowing 與 strict null handling。題目 SHALL NOT 暗示 interface、generic 或 `as` 能在 runtime 驗證外部資料。

#### Scenario: 外部 JSON 題目

- **WHEN** concept 或 practice 使用 JSON / API response
- **THEN** 外部值先以 `unknown` 表示，學生必須透過 runtime check 後才能作為 domain type 使用

#### Scenario: assertion 逃生失敗

- **WHEN** 學生以 `as any`、連續 assertion 或 non-null assertion 隱藏未處理 boundary
- **THEN** rubric 或 AI review 判定未通過並指出缺少的 runtime / null 處理

### Requirement: 型別建模完成線

路徑 SHALL 驗收 structural typing、function contract、literal union、built-in narrowing、discriminated union、`never` exhaustiveness、generic relationship / constraint、`keyof`、indexed access 與常用 utility types；不要求進階型別體操。

#### Scenario: Async state 建模

- **WHEN** 使用者完成 Async State Machine practice
- **THEN** loading、success、error 為互斥 union variants，render 對所有 variants exhaustive，且不存在多 boolean 組成的非法狀態

#### Scenario: Generic 題目

- **WHEN** 使用者回答 generic concept 題
- **THEN** 能指出 type parameter 保存的值間關係與 constraint 理由，不以「讓函式接受任何型別」作為完整答案

### Requirement: TypeScript 實作雙軌驗收

TypeScript practice SHALL 同時通過 strict compile diagnostics 與 runtime tests 才能送 AI review；路徑提供 Unsafe Any Clinic、Async State Machine、Typed Data Page 三個人工 blueprint 實作。

#### Scenario: Runtime 通過但型別失敗

- **WHEN** 使用者程式 runtime tests 全過但存在 TypeScript compile error
- **THEN** 介面顯示 diagnostics 且不得送 AI review

#### Scenario: Typed Data Page capstone

- **WHEN** 使用者完成最後一個 practice
- **THEN** 解答包含 unknown response 的 runtime validation、typed domain model、exhaustive UI state，且無不受控 any / assertion

### Requirement: Junior 範圍限制

核心路徑 SHALL NOT 為 conditional type、`infer`、自訂 mapped / recursive / template literal type、variance、decorator、declaration authoring、module augmentation 或 polymorphic React component 建立 lesson。

#### Scenario: 進階型別候選

- **WHEN** 課綱審查提出進階型別主題
- **THEN** 主題移至 TypeScript Junior → Mid 延伸候選，不擠壓本路徑 18 個 lesson

