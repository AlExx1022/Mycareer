# skill-tree-ui Delta

## MODIFIED Requirements

### Requirement: 技能樹地圖頁

系統 SHALL 在使用者登入後的首頁顯示技能樹地圖：以 Unit 分區、區內按節點的 topic 聚成小群、群內依依賴鏈排列節點、並以連線呈現依賴關係；layout SHALL 可容納約 30 個節點而不損可讀性。

#### Scenario: 登入後看到技能樹

- **WHEN** 已登入使用者開啟首頁
- **THEN** 顯示全部 Unit 與約 30 個節點，同 topic 節點視覺上聚為一群，依賴關係以連線呈現

#### Scenario: 未登入

- **WHEN** 未登入開啟首頁
- **THEN** 導向登入頁（沿用既有 middleware 行為）
