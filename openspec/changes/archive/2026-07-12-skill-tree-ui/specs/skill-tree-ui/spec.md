# Spec: skill-tree-ui

## ADDED Requirements

### Requirement: 技能樹地圖頁
系統 SHALL 在使用者登入後的首頁顯示技能樹地圖：以 Unit 分區、依拓撲層級排列節點、並以連線呈現依賴關係。

#### Scenario: 登入後看到技能樹
- **WHEN** 已登入使用者開啟首頁
- **THEN** 顯示全部 Unit 與節點，依賴關係以連線呈現

#### Scenario: 未登入
- **WHEN** 未登入開啟首頁
- **THEN** 導向登入頁（沿用既有 middleware 行為）

### Requirement: 節點狀態視覺化
系統 SHALL 依掌握度與依賴推導節點狀態並以視覺區分：亮燈（掌握度 ≥ 門檻）、上鎖（任一依賴節點未亮燈）、可學（其餘）。裂開狀態 SHALL 具備視覺樣式，其觸發條件由後續衰減機制定義。

#### Scenario: 掌握度達標的節點亮燈
- **WHEN** 使用者對某節點的掌握度分數達門檻
- **THEN** 該節點以亮燈樣式顯示

#### Scenario: 前置未達成的節點上鎖
- **WHEN** 節點存在任一依賴節點未亮燈
- **THEN** 該節點以上鎖樣式顯示且不可進入課程

### Requirement: 手動標記已會
系統 SHALL 允許使用者對非上鎖節點標記「已會」（寫入滿分掌握度）並可取消，標記結果即時反映節點與下游的狀態。

#### Scenario: 標記已會
- **WHEN** 使用者對可學節點標記已會
- **THEN** 該節點亮燈，僅依賴它的下游節點解鎖

#### Scenario: 取消標記
- **WHEN** 使用者取消某節點的已會標記
- **THEN** 該節點回到可學狀態，下游節點狀態重新推導

#### Scenario: 未登入操作
- **WHEN** 無有效 session 呼叫標記動作
- **THEN** 拒絕操作

### Requirement: 課程入口
系統 SHALL 讓使用者點擊非上鎖節點進入該節點的課程頁路由。

#### Scenario: 點擊可學節點
- **WHEN** 使用者點擊亮燈或可學節點
- **THEN** 導向該節點的課程頁（內容由後續 change 提供）

### Requirement: 進場與狀態動畫
系統 SHALL 以 GSAP 呈現技能樹進場動畫與狀態轉換動畫，並尊重使用者的減少動態偏好。

#### Scenario: 減少動態偏好
- **WHEN** 使用者系統設定 prefers-reduced-motion
- **THEN** 略過或大幅簡化動畫，內容仍完整呈現
