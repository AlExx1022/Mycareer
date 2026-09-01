# skill-tree-ui Delta

## MODIFIED Requirements

### Requirement: 技能樹地圖頁

系統 SHALL 在 `/tree` 顯示技能樹地圖（原為 `/`）：直立單欄 layout——Unit 分區縱向堆疊、區內按節點的 topic 聚成小群、依賴鏈由上往下、依賴關係以連線呈現；地圖 SHALL 在手機寬度直向捲動即可完整瀏覽，無需橫向捲動，桌機置中顯示同一 layout。地圖的渲染、狀態與互動行為不變。

#### Scenario: 登入後看到技能樹

- **WHEN** 已登入使用者開啟 `/tree`
- **THEN** 顯示全部 Unit 與節點，路線由上往下延伸，同 topic 節點視覺上聚為一群，依賴關係以連線呈現

#### Scenario: 未登入

- **WHEN** 未登入開啟 `/tree`
- **THEN** 導向登入頁

#### Scenario: 登入後導向

- **WHEN** 使用者由登入、註冊或 demo 入口完成驗證
- **THEN** 導向 `/tree`

#### Scenario: 標記已會後刷新

- **WHEN** 使用者在地圖上標記或取消標記某節點已會
- **THEN** `/tree` 的技能樹重新取得資料並反映新狀態
