# skill-tree-ui Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: 複習佇列入口提示

技能樹地圖 SHALL 在複習佇列非空時顯示入口提示（含裂開節點數），點擊導向複習頁。

#### Scenario: 有裂開節點時顯示提示

- **WHEN** 使用者有 N 個裂開節點且開啟地圖
- **THEN** 地圖顯示複習入口提示與數量 N，點擊導向 `/review`

#### Scenario: 無裂開節點不顯示

- **WHEN** 使用者無裂開節點
- **THEN** 地圖不顯示複習提示
