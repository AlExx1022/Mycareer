# skill-tree-ui Delta

## MODIFIED Requirements

### Requirement: 技能樹地圖頁

系統 SHALL 在使用者登入後的首頁顯示技能樹地圖：直立單欄 layout——Unit 分區縱向堆疊、區內按節點的 topic 聚成小群、依賴鏈由上往下、依賴關係以連線呈現；地圖 SHALL 在手機寬度（約 360px 可視內容）直向捲動即可完整瀏覽約 30 個節點，無需橫向捲動，桌機置中顯示同一 layout。

#### Scenario: 登入後看到技能樹

- **WHEN** 已登入使用者開啟首頁
- **THEN** 顯示全部 Unit 與約 30 個節點，路線由上往下延伸，同 topic 節點視覺上聚為一群，依賴關係以連線呈現

#### Scenario: 手機直向瀏覽

- **WHEN** 使用者以手機寬度視窗開啟地圖
- **THEN** 僅直向捲動即可看完整條路線，內容不溢出視窗寬度

#### Scenario: 未登入

- **WHEN** 未登入開啟首頁
- **THEN** 導向登入頁（沿用既有 middleware 行為）
