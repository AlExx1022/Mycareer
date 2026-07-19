# decay-review-queue 設計

## Context

C3/C4.5 已有：`user_lesson_mastery`（score、assessedAt，PK userId+lessonId）、`weakness_record`（criterion、一句話摘要、append-only）、C4.5 題型系統（`UnitQuestion` 四題型、批次生成、server 判定、答錯寫弱點）、`deriveNodeStates` 已預留 `cracked` 狀態與樣式、`llm_usage` 日額度。缺的是把「時間」與「弱點」接回學習循環的行為。

## Goals / Non-Goals

**Goals:**

- 衰減公式與裂開門檻定案，讀取時推導，無排程
- 地圖呈現裂開節點；`/review` 今日佇列；弱點導向複習 session；完成後復亮

**Non-Goals:**

- SM-2 等間隔重複演算法（門檻制即可）
- cron / 背景 job（衰減是純函式）
- demo 帳號預灌與視覺打磨（C6）
- 練習型（practice）節點的複習出題——佇列含 practice 節點時導回原課程頁重做

## Decisions

### D1 衰減公式：指數半衰期 + 裂開遲滯門檻

`effectiveScore(score, assessedAt, now) = score × 2^(−daysSince / HALF_LIFE_DAYS)`，`HALF_LIFE_DAYS = 14`。裂開條件：raw score ≥ `MASTERY_THRESHOLD`（70，曾亮燈）且 effective < `CRACK_THRESHOLD = 55`。

- 遲滯（55 < 70）避免剛好 70 分過關的節點隔天就裂開；70 分約 5 天裂、100 分約 12 天裂，作品集時間尺度看得到效果。
- 常數集中在 `src/lib/mastery-decay.ts`，是校準旋鈕不是承諾——真實使用後可調。
- 捨棄線性衰減：指數是遺忘曲線的標準敘事，實作成本相同。

### D2 讀取時計算，不落地

有效掌握度與裂開狀態由技能樹查詢時以純函式推導，DB 不存 cracked、不跑排程。永遠一致、零基礎設施；代價是每次讀都算，30 節點可忽略。

### D3 裂開不重新上鎖下游

解鎖判定（lit set）沿用 raw score ≥ 70（曾學會就算數），cracked 只影響視覺與佇列。避免一個節點衰減導致整條下游鎖死的敵意體驗。

### D4 複習 session 獨立表

新增 `review_session`（PK userId+lessonId、questions snapshot、進度、`sourceWeaknessIds`、version、updatedAt），結構仿 `lesson_session.unitsState`。不重用 lesson_session：學習 session 的對話歷史與 LangGraph phase 對複習是包袱——複習是純題目循環（生成 → 逐題作答 → 完成），無教學、無蘇格拉底檢核。完成後刪除 row，下次裂開重新出題（弱點集可能已變）。

### D5 出題打向弱點、可追溯

重用 `units.ts` 的生成 schema 與題目 widget。生成 prompt 注入該節點最近 10 筆弱點摘要，題目針對誤解出；使用的 `weaknessRecord.id` 存入 `sourceWeaknessIds`（驗收：出題可追溯到弱點記錄）。該節點無弱點記錄時退回以考點為範圍出題。出題計 1 次 LLM 額度，問答題判定沿用既有計費；客觀題答錯照 C4.5 規則寫入新弱點（記憶循環閉合）。

### D6 完成複習的掌握度回寫

全部題目完成時：`score = 70 + round(30 × 首次答對題數 / 總題數)`、`assessedAt = now`。首次作答對錯決定分數，重答只為推進。答得差分數低 → 衰減更快、更早再裂開，行為上近似間隔重複而不用演算法。

### D7 佇列 = 裂開節點

`/review` 佇列列出裂開節點（依 effective 由低到高排序），每列附該節點弱點摘要。有弱點但未裂開的節點不進佇列（記憶還新鮮）。佇列非空時地圖入口顯示提示。

## Risks / Trade-offs

- [衰減常數無真實數據支撐] → 常數集中一處，D1 明示為校準旋鈕；C6 demo 帳號靠預灌舊 assessedAt 展示，不依賴等待。
- [弱點摘要品質影響出題] → 無弱點或摘要空泛時退回考點出題（D5 fallback），複習仍可用。
- [完成即刪 review_session] → 中斷續作靠 row 存在性；刪除後重進是重新出題，多花 1 次額度，可接受。
