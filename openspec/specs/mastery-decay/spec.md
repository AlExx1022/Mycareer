# mastery-decay Specification

## Purpose
掌握度時間衰減模型：有效掌握度公式、裂開門檻與裂開狀態推導（讀取時計算，無排程）。
## Requirements
### Requirement: 有效掌握度衰減
系統 SHALL 以指數半衰期公式在讀取時推導有效掌握度：`effective = score × 2^(−距 assessedAt 天數 / 14)`，不落地儲存、不依賴排程；公式常數 SHALL 集中於單一模組。

#### Scenario: 剛評估的節點不衰減
- **WHEN** 節點的 assessedAt 為當下
- **THEN** 有效掌握度等於原始分數

#### Scenario: 隨時間衰減
- **WHEN** 節點的 assessedAt 距今 14 天
- **THEN** 有效掌握度為原始分數的一半（讀取時計算）

### Requirement: 裂開狀態推導
系統 SHALL 將「原始分數 ≥ 亮燈門檻（70）且有效掌握度 < 裂開門檻（55）」的節點推導為裂開（cracked）。裂開 SHALL NOT 影響下游解鎖——解鎖判定沿用原始分數。

#### Scenario: 衰減跌破門檻即裂開
- **WHEN** 曾亮燈節點的有效掌握度衰減至低於 55
- **THEN** 該節點狀態為 cracked

#### Scenario: 遲滯區間不裂開
- **WHEN** 曾亮燈節點的有效掌握度介於 55 與 70 之間
- **THEN** 該節點維持亮燈狀態

#### Scenario: 裂開不鎖下游
- **WHEN** 某節點裂開且其下游節點的其他依賴皆曾亮燈
- **THEN** 下游節點維持可學／亮燈，不因裂開而上鎖

### Requirement: 衰減狀態隨技能樹查詢提供
技能樹查詢 API 的每節點掌握度 SHALL 附上有效掌握度與裂開旗標，供地圖與複習佇列使用。

#### Scenario: API 回傳衰減欄位
- **WHEN** 已登入使用者請求技能樹 API
- **THEN** 已評估節點的掌握度含原始分數、有效掌握度與是否裂開
