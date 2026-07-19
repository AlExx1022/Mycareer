# skill-tree-ui Specification

## Purpose
TBD - created by archiving change skill-tree-ui. Update Purpose after archive.
## Requirements
### Requirement: 技能樹地圖頁
系統 SHALL 在使用者登入後的首頁顯示技能樹地圖：以 Unit 分區、區內按節點的 topic 聚成小群、群內依依賴鏈排列節點、並以連線呈現依賴關係；layout SHALL 可容納約 30 個節點而不損可讀性。

#### Scenario: 登入後看到技能樹
- **WHEN** 已登入使用者開啟首頁
- **THEN** 顯示全部 Unit 與約 30 個節點，同 topic 節點視覺上聚為一群，依賴關係以連線呈現

#### Scenario: 未登入
- **WHEN** 未登入開啟首頁
- **THEN** 導向登入頁（沿用既有 middleware 行為）

### Requirement: 節點狀態視覺化
系統 SHALL 依掌握度與依賴推導節點狀態並以視覺區分：亮燈（原始分數 ≥ 門檻且未裂開）、裂開（依 mastery-decay 推導：曾亮燈且有效掌握度 < 裂開門檻）、上鎖（任一依賴節點未曾亮燈）、可學（其餘）。裂開節點 SHALL 仍可點擊進入。

#### Scenario: 掌握度達標的節點亮燈
- **WHEN** 使用者對某節點的掌握度分數達門檻且有效掌握度未跌破裂開門檻
- **THEN** 該節點以亮燈樣式顯示

#### Scenario: 衰減節點裂開
- **WHEN** 曾亮燈節點依 mastery-decay 推導為裂開
- **THEN** 該節點以裂開樣式顯示，仍可點擊進入

#### Scenario: 前置未達成的節點上鎖
- **WHEN** 節點存在任一依賴節點未曾亮燈
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

### Requirement: 複習佇列入口提示
技能樹地圖 SHALL 在複習佇列非空時顯示入口提示（含裂開節點數），點擊導向複習頁。

#### Scenario: 有裂開節點時顯示提示
- **WHEN** 使用者有 N 個裂開節點且開啟地圖
- **THEN** 地圖顯示複習入口提示與數量 N，點擊導向 `/review`

#### Scenario: 無裂開節點不顯示
- **WHEN** 使用者無裂開節點
- **THEN** 地圖不顯示複習提示

