# curriculum-regrain（C4.6）

## Why

C4.5 手動驗收回饋（2026-07-18）：單一節點概念太廣（如「JSX 與渲染模型」一節塞了編譯本質、render/commit、DOM 衝突三個概念），且進節點後開場生硬——考點列表加一段 150 字講解就直接開考，零基礎使用者缺乏背景導入與應用場景。參考 roadmap.sh 的細粒度學習路線：一個節點聚焦一個概念，課內由淺入深。

## What Changes

- **課綱重策展**：現有 12 個概念節點的每個 examPoint 升格為獨立節點（約 30 個），Unit 分組不變，同原主題的節點以 `dependsOn` 串成鏈。每個新節點含 2–3 個更細的 examPoints（依難度遞進排序）與 rubric。**BREAKING**：lesson slug 全面更換，既有帳號學習進度作廢（作品集階段可接受）。
- **課前導入**：課綱新增人工策展 `intro` 欄位（為什麼要學、實際應用場景、學完能做什麼），進節點時直接渲染，不經 LLM。lessons 表 additive migration 加欄位。
- **教學深度**：小單元教學訊息由 150 字內放寬為 200–400 字結構模板（是什麼 → 為什麼 → 類比 → 程式碼例），單元依難度標示基礎/進階/深入（由順序推導，無 schema 變更）。
- **地圖聚群**：技能樹地圖 ~30 節點按 Unit 排列、同原主題節點視覺聚成小群，只調 layout。
- 不做：遊戲化視覺（徽章/streak，另立 change）、三層 schema、練習型節點改動。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `skill-tree-data`: 節點粒度改為「一節點一概念」；課綱與 lessons 表新增 intro（課前導入）欄位；examPoints 依難度遞進排序。
- `lesson-session`: 概念節點進場流程改為「課前導入 → 分層小單元 → 收尾檢核」；單元教學訊息 200–400 字結構模板；單元難度標籤顯示。
- `skill-tree-ui`: 地圖支援 ~30 節點的主題聚群 layout。

## Impact

- **DB**：lessons 表加 `intro` 欄位（additive migration）、重跑 db:seed；lesson slug 更換使既有 mastery/weakness/session 紀錄失效。
- **課綱**：`src/db/curriculum/react-junior-mid.ts` 全面重策展（LLM 草稿 + 作者人工審訂）。
- **API/LLM**：`/api/lesson/[slug]/chat` 教學 prompt 與開場流程調整；出題/判定機制（C4.5）不變；LLM 用量結構不變（導入零成本、單元數總量近似）。
- **UI**：`lesson-chat.tsx`（導入渲染、難度標籤）、`skill-tree-map.tsx`（聚群 layout）。
