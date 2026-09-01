# lesson-session Delta

## ADDED Requirements

### Requirement: 主題與程式語言上下文

系統 SHALL 從 lesson 所屬 Learning Path 建立教學上下文，並將 subject 與 codeLanguage 一致套用至概念教學、單元題目、收尾檢核與弱點複習；prompt SHALL NOT 假設所有 lesson 都是 React 或所有程式碼都是 TypeScript。

#### Scenario: JavaScript 概念節點

- **WHEN** 使用者進入 subject 為 JavaScript、codeLanguage 為 JavaScript 的概念 lesson
- **THEN** 導師以 JavaScript 主題教學，讀碼題與程式碼範例使用 JavaScript

#### Scenario: React 概念節點回歸

- **WHEN** 使用者進入既有 React 路徑的概念 lesson
- **THEN** 導師仍以 React 主題教學且程式碼範例使用 TypeScript，既有教學流程與額度規則不變

#### Scenario: 複習沿用原課程上下文

- **WHEN** 任一語言 lesson 裂開並開始弱點複習
- **THEN** 複習題沿用該 lesson 的 subject 與 codeLanguage，不使用其他路徑的術語或語法

### Requirement: Lesson 所屬路徑可追溯

lesson session SHALL 保存或可由 lessonId 穩定查得 pathId；續作舊 session 時 SHALL 由當前 curriculum metadata 補入上下文，不要求重建既有 React session。

#### Scenario: 舊 React session 續作

- **WHEN** 使用者在 migration 後繼續既有 React lesson session
- **THEN** 系統以不變的 lessonId 還原進度，並由所屬 path 取得 React／TypeScript 上下文

