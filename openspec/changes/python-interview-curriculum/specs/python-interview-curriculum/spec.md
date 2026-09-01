# python-interview-curriculum Specification

## ADDED Requirements

### Requirement: Python Junior 面試核心路徑

系統 SHALL 提供 `python-interview-core` 學習路徑，包含 4 個依序解鎖的 Unit 與 22 個 Lesson（17 concept、5 practice），範圍依序涵蓋 Python 物件與資料、函式與惰性運算、模組／錯誤／型別／測試、物件設計與 Junior coding patterns。

#### Scenario: 初次 seed Python 路徑

- **WHEN** 在前置 curriculum changes 驗收後執行 curricula aggregate seed
- **THEN** DB 新增 Python path、4 Units、22 Lessons 與同 path dependencies，既有路徑與使用者資料不變

#### Scenario: 路徑獨立開始

- **WHEN** 使用者尚未完成 JavaScript、TypeScript 或 React 路徑而進入 Python path
- **THEN** Python 第一個 lesson 可學，不受其他語言 mastery 鎖定

### Requirement: Python 語意面試完成線

Python concept SHALL 驗收 name binding、mutability、identity / equality、hashability、collection selection、mutable defaults、LEGB / late binding、iterator / generator、exception boundary、module namespace、typing runtime boundary 與測試隔離。rubric SHALL 要求以 Python 行為解釋，不接受直接套用 JavaScript / TypeScript 心智模型。

#### Scenario: Mutable default 題目

- **WHEN** 使用者學習 mutable default lesson
- **THEN** 能預測跨呼叫共享狀態、解釋 default 建立時機並以 sentinel / factory 修正

#### Scenario: Type hints 題目

- **WHEN** 使用者回答 Python typing 題
- **THEN** 能說明 annotation 預設不在 runtime 強制驗證，並區分 static checker 與輸入 validation

### Requirement: Python 瀏覽器實作與本機交付 gate

五個 Python practice SHALL 使用 Pyodide Web Worker 執行標準函式庫範圍的程式與測試；worker 全過後仍由 AI review 依 blueprint / rubric 判定。Typed CLI capstone 與 test refactor SHALL 另提供可在本機 Python 環境以 pytest 驗收的完整 source contract。

#### Scenario: Python practice 執行

- **WHEN** 使用者在 Python practice 修改程式碼
- **THEN** 程式在 Web Worker 執行、逾時可終止、逐條測試顯示結果，application server 不執行學生 Python

#### Scenario: 使用不支援能力

- **WHEN** 題目或解答依賴 socket、subprocess、native-only package 或未策展的外部 network
- **THEN** curriculum / generation validation 拒絕該題並提示 Pyodide runtime 邊界

#### Scenario: Capstone 本機驗收

- **WHEN** 使用者準備完成 Typed CLI capstone
- **THEN** 交付 contract 要求在本機隔離環境安裝並執行 pytest，通過 malformed input、boundary 與成功案例後才符合完整 rubric

### Requirement: Python Capstone

路徑 SHALL 以「履歷與職缺技能差距分析 CLI」作為跨 Unit capstone，涵蓋 JSON / CSV 輸入、技能正規化、frequency / gap 排序、JSON / Markdown 輸出、清楚錯誤邊界、type hints、package layout 與 tests。

#### Scenario: Capstone 核心設計

- **WHEN** 使用者提交 capstone code review
- **THEN** parser / domain / reporter 邊界分離，核心轉換為 pure functions，資料結構選擇與 Big-O 可被口頭解釋

#### Scenario: Capstone 錯誤案例

- **WHEN** 測試輸入為空、重複技能、malformed JSON、未知欄位或錯誤編碼
- **THEN** 程式依 blueprint 回傳明確結果或可診斷錯誤，不吞 exception 或產生不完整報告

### Requirement: Python 課綱範圍限制

核心路徑 SHALL NOT 為 Web framework、ORM / database、asyncio / GIL、data science library、scraping、metaclass / descriptor、進階 typing、tree / graph / DP 建立 lesson。

#### Scenario: Backend framework 候選

- **WHEN** 課綱審查提出 FastAPI、Django、SQLAlchemy 或 database 主題
- **THEN** 主題移至由目標 JD 驗證後的 Python Web Backend change，不加入本路徑 22 個 lesson

