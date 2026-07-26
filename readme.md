# Mycareer — 結構化 AI 學習系統（工程師版 Duolingo）

Duolingo 的學習結構 × AI 家教的深度，對象是工程師。技能樹上點一個節點，AI 教你 → 出題檢核 → 追問到確認真懂 → 掌握度更新，久沒複習的節點會裂開回到複習佇列。

**Demo**：https://mycareer-pi.vercel.app （首頁是專案簡報，可用 demo 帳號一鍵進站，也可自行註冊）
**狀態**：核心循環已上線（C0–C6.3 完成），第一條路徑 React Junior → Mid 可完整體驗。

## 為什麼做

幾億人已經在跟 AI 來回學習，但那是混沌的——今天亂問 X、明天亂問 Y，沒有課綱、沒有進度、AI 不記得你學過什麼、你不知道接下來該學什麼。

**差異化對象不是其他 app，是「裸用 ChatGPT 學習」**：

| | 裸用 ChatGPT | roadmap.sh | 本產品 |
| --- | --- | --- | --- |
| 有學習路徑 | ✗ | ✓（靜態） | ✓ |
| 會教你、能追問 | ✓ | ✗ | ✓ |
| 記得你學過什麼、哪裡虛 | ✗ | ✗ | ✓ |
| 驗收你真的懂了 | ✗ | ✗ | ✓ |

**借 Duolingo 的是骨架，不是外皮**：路徑、關卡、檢核、錯題回流留下；streak、寶石、吉祥物等遊戲化全部不要。

**課綱分工一半一半**：學習骨架（單元、節點、依賴、考點與 rubric）人工策展——品質不可賭；個人化補強內容（針對你的弱點記錄生成的練習與追打）AI 動態生成——本來就該因人而異。

## 目前進度

| 階段 | 內容 | 狀態 |
| --- | --- | --- |
| C0 | Next.js + Drizzle + Better Auth + Vercel 部署 | ✅ |
| C1 | 技能樹資料層（schema 主題無關 + React 課綱 seed） | ✅ |
| C2 | 技能樹地圖 UI（三態節點、GSAP、標記已會） | ✅ |
| C3 | LangGraph.js 學習循環（教學 → 蘇格拉底檢核 → 掌握度） | ✅ |
| C4 | 實作型節點（Sandpack + 測試 + AI code review） | ✅ |
| C4.5 / C4.6 | 小單元制、混合題型、課綱粒度重構（12 → 24 節點） | ✅ |
| C5 | 掌握度衰減、節點裂開、弱點導向複習佇列 | ✅ |
| C6.1 / C6.2 | 視覺打磨（Duolingo 風蜿蜒技能樹、糖果色設計） | ✅ |
| C6.3 | Landing page（`/` 專案簡報 + demo 一鍵入口，技能樹移至 `/tree`） | ✅ |

開發階段的完整編排見 [`roadmap.md`](roadmap.md)，規格與變更提案在 [`openspec/`](openspec/)。

## 學習結構

- **路徑（Path）**：人工策展的技能樹 JSON——單元（Unit）→ 節點（Lesson），節點間有依賴關係，未解鎖不能跳。目前 2 個 Unit、24 個節點（20 概念型 + 4 實作型），依 12 個 topic 聚群。
- **節點兩型**：
  - **概念型**（closure、render/commit、dependency array…）：蘇格拉底對話檢核。
  - **實作型**（寫 useDebounce、受控表單…）：瀏覽器內寫 code 驗收。
- **檢核即課程**：不是「看完打勾」。AI 教學 → 出題 → 使用者回答 → 追問到確認真懂，掌握度才更新。每節點附人工撰寫的考點與過關 rubric，檢核引擎以此為據，不靠 LLM 自由心證。
- **小單元制**：一個節點拆成數個小單元（基礎 → 進階 → 深入），每單元 3–5 題、混合題型（選擇、填空、口述），做完即回饋。
- **起點定位**：入門時手動勾選已會的節點，直接亮燈跳過。
- **知識會裂開**：掌握度隨時間衰減，久未複習的節點在技能樹上裂開，連同歷史錯題進複習佇列。

## 核心循環

```
選節點 → 導入 → 教學（對話）→ 檢核 → 掌握度更新 → 推薦下一步（新節點 or 複習）

檢核分支：
  概念型：蘇格拉底追問（答錯 → 換角度再教 → 再問）
  實作型：出題 → Sandpack 編輯器寫 code → 測試通過 + AI code review
```

**語意級弱點記錄**：檢核中暴露的具體誤解（例：「以為 useEffect cleanup 只在 unmount 執行」）以文字存檔，不只是分數。後續出題與複習會刻意打向這些記錄——這是「AI 記得你」的實體。

### LangGraph 在這裡做什麼

**它是「上課流程的狀態機」，不是聊天引擎**——決定這一輪該教、該考、該換角度重教還是該過關；講話交給 AI SDK。

| 誰 | 負責 |
| --- | --- |
| LangGraph.js | 流程判斷與 session 狀態（`phase` / `checkState` / 本輪弱點） |
| `generateObject` | 檢核判定：逐條 rubric 判 pass/fail，未過時輸出一句話誤解描述 |
| `streamText` | 把 graph 產出的 `replyInstructions` 轉成對學生的自然語言 |
| Postgres | session 快照持久化（自建表，非 checkpointer） |

```
START ─┬─ teach    ──→ END          小單元做完，開場收尾檢核
       └─ evaluate ─┬─ pass    ──→ END   全 rubric 通過 → 掌握度寫 100、節點亮燈
                    └─ reteach ──→ END   換角度再教，累計 failedAttempts
```

判定權不在模型手上：`evaluate` 拿人工撰寫的 rubric（`criterion` + `passCondition`）逐條判，全過才更新掌握度，沒過的誤解寫進 `weaknessRecord`——這就是複習佇列的燃料。

兩個刻意的決定：

- **不用 checkpointer**：session 狀態要跟 `userId + lessonId` 綁、要被技能樹與複習佇列查詢，本來就得是自己的表；`STATE_VERSION` 不相容時整個 session 重開。
- **為什麼不是 if/else**：目前圖確實小，選它是為了狀態 schema 顯式（`Annotation.Root` 聲明 phase、checkState、weaknesses）與分支圖化——之後要插 placement 測驗或 Unit checkpoint 是加一個 node，不是改一坨條件。

## 技術棧

| 層級 | 選型 |
| --- | --- |
| 框架 | Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS v4 |
| Agent 流程 | LangGraph.js（session 狀態機，狀態自存 Postgres） |
| LLM 介接 | Vercel AI SDK v7 → AI Gateway，模型 `google/gemini-3-flash` |
| 程式碼執行 | Sandpack（瀏覽器內，不需後端沙箱） |
| 資料庫 | Neon Postgres + Drizzle ORM |
| 認證 | Better Auth（Email/Password，含 demo 帳號） |
| 動畫 | GSAP |
| 部署 | Vercel 單一服務 |

單一語言、單一服務。對「前端 + AI 應用」作品集的敘事：用 TS 全端掌控 agent 流程。

## 本地開發

```bash
npm install
cp .env.example .env          # 填 DATABASE_URL、BETTER_AUTH_SECRET、DEMO_* 等
vercel env pull               # 取得 AI Gateway 憑證（或自行設 AI_GATEWAY_API_KEY）
npm run db:migrate            # 套用 Drizzle migration
npm run db:seed               # 灌課綱 + 建立 demo 帳號
npm run dev
```

`LLM_DAILY_LIMIT`（預設 50）限制單一使用者每日 LLM 呼叫次數，公開網址不裸奔成本。

