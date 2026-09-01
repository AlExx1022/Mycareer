# skill-tree-ui Delta

## MODIFIED Requirements

### Requirement: 技能樹地圖頁

系統 SHALL 在 `/tree/[pathId]` 顯示指定學習路徑的直立單欄技能樹：Unit 分區縱向堆疊、區內按 topic 聚群、群內依依賴鏈排列並以連線呈現。地圖 SHALL 只渲染目前 path 的節點，在手機寬度無橫向捲動，桌機置中顯示。

#### Scenario: 登入後看到指定路徑技能樹

- **WHEN** 已登入使用者開啟有效的 `/tree/[pathId]`
- **THEN** 只顯示該 path 的 Unit 與節點，同 topic 節點視覺聚群，依賴關係以連線呈現

#### Scenario: 切換學習路徑

- **WHEN** 使用者從路徑技能樹返回 `/tree` 並選擇另一條 path
- **THEN** 地圖以另一條 path 的資料重新建立，不混入上一條 path 的節點或狀態

#### Scenario: 未登入

- **WHEN** 未登入開啟 `/tree` 或 `/tree/[pathId]`
- **THEN** 導向登入頁

