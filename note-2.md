# Mycareer 面試速查

> 用途：面試前掃一遍。左邊是被問到的問題，右邊是怎麼答。
> Demo：https://mycareer-pi.vercel.app

---

## 0. 30 秒自我介紹版本

> 「Mycareer 是一個給工程師的結構化 AI 學習系統，借 Duolingo 的學習骨架——路徑、關卡、檢核、錯題回流——但深度來自 AI 家教。技術上是 Next.js 16 全端單一服務，用 LangGraph.js 管上課流程的狀態機，Neon Postgres + Drizzle 存狀態，部署在 Vercel。差異化對象不是其他 app，是『裸用 ChatGPT 學習』——它記得你學過什麼、哪裡虛。」

被追問「所以你做了什麼」時，**不要答「我寫了幾支 API」**，答這四件事（詳見 §5）：

1. LangGraph 狀態機而非 if/else 的取捨
2. 不用 checkpointer、自建 session 表的理由
3. 判定權不交給 LLM——rubric 逐條判
4. 成本控制：客觀題零 LLM 呼叫 + 每日額度

---

## 1. 這是前端還是全端專案？

**全端。** Next.js 把前後端寫在同一個資料夾，看起來像前端，但判斷標準只有一個：**檔案有沒有 `"use client"`**。

| 檔案 | 跑在哪 | 性質 |
| --- | --- | --- |
| `src/app/tree/page.tsx` | Server（Node on Vercel） | 後端 |
| `src/app/skill-tree-map.tsx`（`"use client"`） | 瀏覽器 | 前端 |
| `src/app/api/**/route.ts` | Server | 後端 |
| `src/app/lesson-actions.ts`（`"use server"`） | Server | 後端 |
| `src/lib/**`、`src/db/**` | Server | 後端 |

沒有 `"use client"` 的檔案預設在伺服器執行，可以直連資料庫、讀環境變數、呼叫 LLM。`DATABASE_URL`、`AI_GATEWAY_API_KEY` 永遠不會進到瀏覽器。

**行數比**：後端邏輯（`src/lib` + `src/db` + `src/app/api`，不含課綱與測試）約 2,300 行；前端 `.tsx` 約 2,800 行。加上人工策展課綱 655 行。

> 「單一服務不等於只有前端。傳統是 React 前端 + Express 後端兩個 repo 兩份部署，這裡是一個 repo 同時扮演兩角，Vercel 上跑的是 Node.js server，不是靜態網站。」

---

## 2. 技術棧

| 層 | 選型 | 一句話理由 |
| --- | --- | --- |
| 框架 | Next.js 16 App Router + React 19 + TS + Tailwind v4 | 單一語言全端，server/client 邊界明確 |
| Agent 流程 | LangGraph.js | 狀態 schema 顯式、分支圖化 |
| LLM | Vercel AI SDK v7 → AI Gateway，`google/gemini-3-flash` | 便宜、可換模型不改 code |
| 程式碼執行 | Sandpack（瀏覽器內） | 不用自建後端沙箱 |
| DB | Neon Postgres + Drizzle ORM | serverless 友善、TS 型別直通 |
| 認證 | Better Auth（Email/Password + demo 帳號） | cookie session，不用自己刻 |
| 部署 | Vercel 單一服務 | Fluid Compute，`maxDuration = 300` 跑 LLM 串流 |

---

## 3. 架構：資料怎麼進出

### 分層

| 層 | 位置 | 責任 |
| --- | --- | --- |
| HTTP 邊界 | `src/app/api/**/route.ts` | 認證、輸入驗證、額度扣除、串流回應 |
| 商業邏輯 | `src/lib/**` | LangGraph 流程、出題判題、衰減公式、session 存取 |
| 資料 | `src/db/**` | schema、query helper、課綱 seed |

Route handler 幾乎只做編排，邏輯全在 `src/lib`。

### 讀：三種模式

**A. Server Component 直接查 DB（首屏資料，主要方式）**

```tsx
// src/app/tree/page.tsx
export default async function TreePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const units = await getSkillTreeForUser(session.user.id);  // 直接打 Postgres
  return <SkillTreeMap units={units} />;                     // 資料當 props 傳下去
}
```
沒有 fetch、沒有 API、沒有 loading state。`SkillTreeMap` 雖然是 `"use client"`（要跑 GSAP），但不自己抓資料。

**B. Client fetch（互動後才產生的資料）**

```tsx
// src/app/lesson/[slug]/lesson-chat.tsx
const res = await fetch(`/api/lesson/${slug}/answer`, {
  method: "POST",
  body: JSON.stringify({ questionId: active.question.id, answer }),
});
```
不帶 token——認證靠 Better Auth 的 cookie，瀏覽器自動附上，server 用 `auth.api.getSession({ headers })` 讀出來。

**C. 串流（AI 對話）**

```tsx
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({ api: `/api/lesson/${slug}/chat` }),
  messages: initialMessages,        // 續作歷史，來自模式 A
  onData: (part) => { if (part.type === "data-question") setActive(part.data); },
});
```
server 端 `createUIMessageStream` 邊算邊送 SSE。`onData` 是自訂事件——除了文字還夾帶「下一題」推給前端。

> **原則**：能在 server component 拿的就在那拿（少一趟 round trip、不用 loading state），只有「使用者做了某件事之後才知道結果」的才走 API route。

### 寫：兩種路徑

**路徑 1：Server Action（表單式操作）**

```ts
// src/app/lesson-actions.ts
"use server";
export async function markLessonKnown(lessonId: string) {
  const userId = await requireUserId();
  await db.insert(userLessonMastery)
    .values({ userId, lessonId, score: 100, assessedAt: new Date() })
    .onConflictDoUpdate({ target: [...], set: { score: 100, assessedAt: new Date() } });
  revalidatePath("/tree");   // 告訴框架這頁快取髒了，自動重畫
}
```
Client 直接 `import` 後當本地函式呼叫，Next.js 編譯時轉成隱藏的 HTTP 呼叫。

**路徑 2：Route Handler 內部寫（API 流程的副作用）**

```ts
// src/app/api/lesson/[slug]/chat/route.ts
if (result.newWeaknesses.length > 0) await db.insert(weaknessRecord).values(...);
if (result.phase === "passed")       await db.insert(userLessonMastery)...;

// 串流結束才存整包 session
onFinish: async ({ text }) => {
  snapshot.messages.push({ role: "assistant", content: text });
  await saveSession(userId, slug, snapshot);
}
```

**寫入點總覽**

| 寫什麼 | 觸發 | 在哪 |
| --- | --- | --- |
| `userLessonMastery` | 手動標記已會 | Server Action |
| `userLessonMastery` | 檢核過關 / 實作通過 / 複習完成 | chat、practice、review route |
| `weaknessRecord` | 答錯、rubric 沒過 | answer、chat、review route |
| `lessonSession` | 每輪對話結束 | `saveSession()` |
| `reviewSession` / `practiceSession` | 複習 / 實作進行中 | `review-session.ts`、practice route |
| `llmUsage` | 每次呼叫 LLM 前 | `consumeLlmQuota()` |
| 課綱 | 開發者跑 `npm run db:seed` | `seed-skill-tree.ts` |

session 用 `onConflictDoUpdate`（有就更新沒有就新增）整包 JSONB upsert，同一 user + lesson 永遠一列。

### 完整流程：使用者在 use-effect 節點答錯一題

```
瀏覽器                 Vercel Next.js server                    Neon Postgres
  │ ① 進 /lesson/use-effect
  ├────────────────►  page.tsx（RSC）
  │                   getSession(cookie) / db.select(lesson) / loadSession()  ──► 讀
  │ ◄────────────────  已含資料的 HTML（無轉圈圈）
  │ ② 點選答案
  ├────────────────►  POST /api/lesson/[slug]/answer
  │                   judgeAnswer() 比對正解（零 LLM）
  │                   答錯 → weaknessRecord + saveSession()                   ──► 寫
  │ ◄────────────────  { correct: false, explanation }
  │ ③ 單元做完，送出對話
  ├────────────────►  POST /api/lesson/[slug]/chat（SSE）
  │                   consumeLlmQuota()                                       ──► 寫
  │                   LangGraph evaluate → generateObject 逐條判 rubric
  │                   過關 → userLessonMastery                                ──► 寫
  │ ◄◄◄◄◄◄◄◄◄◄◄◄◄◄  streamText 逐字回覆；onFinish → saveSession()          ──► 寫
  │ ④ 回 /tree
  ├────────────────►  getSkillTreeForUser() → effectiveScore() 算衰減
  │                                          → deriveNodeStates() 算解鎖      ──► 讀
```

---

## 4. 資料模型（10 張表）

- **認證**：`user` / `session` / `account` / `verification`（Better Auth 產生）
- **課綱**：`unit` / `lesson` / `lessonDependency` / `userLessonMastery`
- **學習狀態**：`lessonSession` / `practiceSession` / `reviewSession` / `weaknessRecord` / `llmUsage`

**兩個值得講的設計**：

- 課綱 schema **主題無關**——React 課綱只是一份 seed，換 Go、換系統設計不用改 schema。
- 掌握度**不存當下有效分數**，只存 `score + assessedAt`，讀取時由 `mastery-decay.ts` 用半衰期 14 天即時算 `effectiveScore`，低於 55 判 `cracked`。解鎖狀態同理由 `deriveNodeStates` 從依賴圖推導，不落庫。
  → **理由：衍生值不落庫，避免更新遺漏造成資料不一致。**

---

## 5. 四個核心設計決策（面試主戰場）

### ① 為什麼用 LangGraph 而不是 if/else

**它是「上課流程的狀態機」，不是聊天引擎**——決定這一輪該教、該考、該換角度重教還是該過關；講話交給 AI SDK。

```
START ─┬─ teach    ──→ END            小單元做完，開場收尾檢核
       └─ evaluate ─┬─ pass    ──→ END  全 rubric 通過 → 掌握度寫 100
                    └─ reteach ──→ END  換角度再教，累計 failedAttempts
```

| 誰 | 負責 |
| --- | --- |
| LangGraph.js | 流程判斷與 session 狀態（`phase` / `checkState` / 本輪弱點） |
| `generateObject` | 檢核判定：逐條 rubric 判 pass/fail |
| `streamText` | 把 graph 產出的 `replyInstructions` 轉成自然語言 |
| Postgres | session 快照持久化 |

**誠實承認**：「目前圖確實小，if/else 也寫得出來。選它是為了狀態 schema 顯式（`Annotation.Root` 聲明 phase、checkState、weaknesses）與分支圖化——之後要插 placement 測驗或 Unit checkpoint 是加一個 node，不是改一坨條件。」
→ 這個「承認現在還不需要、但解釋為什麼提前付這個成本」的答法，比硬拗有說服力。

### ② 為什麼不用 LangGraph 的 checkpointer

session 狀態要跟 `userId + lessonId` 綁、要被技能樹與複習佇列查詢，本來就得是自己的表。用 checkpointer 等於多一層不受控的持久化。自建 `lessonSession` 表，`STATE_VERSION = 2`，schema 不相容時整個 session 重開。

### ③ 判定權不在模型手上

```ts
const { object } = await generateObject({
  model: MODEL,
  schema: z.object({ results: z.array(z.object({
    criterion: z.string(), passed: z.boolean(), misconception: z.string(),
  })) }),
  prompt: `你是檢核引擎。嚴格依 passCondition 判定，不要放水也不要苛求…`,
});
```

`evaluate` 拿**人工撰寫**的 rubric（`criterion` + `passCondition`）逐條判，全過才更新掌握度，沒過的誤解寫進 `weaknessRecord`。

> 「課綱分工一半一半：學習骨架（單元、節點、依賴、考點與 rubric）人工策展，品質不可賭；個人化補強內容 AI 動態生成，本來就該因人而異。」

**語意級弱點記錄**是這個專案的靈魂：存的不是分數，是「以為 useEffect cleanup 只在 unmount 執行」這種具體誤解文字。後續出題與複習會刻意打向這些記錄——這是「AI 記得你」的實體。

### ④ 成本控制

- 客觀題（選擇、填空）在 server 直接比對正解，**完全不呼叫 LLM**；只有問答題走 `judgeFreeAnswer`。
- `llmUsage` 表按 UTC 日計數，`LLM_DAILY_LIMIT` 預設 50，超過回 429。
- 模型統一走 AI Gateway，換模型改一個常數。

> 「公開網址不裸奔成本」——這句話面試官會有感。

---

## 6. 測試怎麼做

沒有引入測試框架，用 `*.selfcheck.ts` + `tsx` 直接跑，`npm test` 串三支（skill-tree / mastery-decay / review-session），CI 在 GitHub Actions。

**能這樣測的前提**：純函式邏輯（衰減、解鎖、計分）都抽成獨立檔案，不寫在 route 或元件裡。需要 DB 的 `test:db` 另外跑。

被問「為什麼不用 Vitest」→ 誠實答：「這階段的驗證需求是純函式斷言，`tsx` 跑一支腳本就夠，還沒到需要 runner 的複雜度。要加測 API 層或 DB 互動時會換。」

---

## 7. 「這算常見的做法嗎？」

**是，且是 2024 年後新專案的主流之一。** Cal.com、Dub、大量 YC 新創與 SaaS 都是這形狀；`create-t3-app` 這類 starter 能紅就是需求證明。同類還有 Remix / React Router v7、SvelteKit、Nuxt——概念一樣。

但要知道邊界：

| 適合 | 不適合 |
| --- | --- |
| 產品型 web app、SaaS、作品集 | gRPC、長連線 worker、重運算服務 |
| 小團隊、單一語言、快速迭代 | 多 client（web + iOS + Android + 第三方 API）共用後端 |
| 後端主要在做 CRUD + 外部 API 編排 | 團隊已有 Java/Go/Python 後端生態 |

規模大或多端的公司仍多是 **React 前端 + 獨立後端服務**，Next.js 只當 BFF。兩種世界並存，不是誰取代誰。

---

## 8. 「為什麼不前後端分離？」

常跟 §7 一起被問。**主軸只有一句：邏輯是分離的，部署不分離。**

> 「我的商業邏輯本來就跟前端分離了——`src/lib` 和 `src/db` 是純 TypeScript，除了 `auth-client.ts`（那本來就是給瀏覽器的 Better Auth client）之外，沒有任何檔案 import React 或 `next/`。LangGraph 狀態機、rubric 判定、衰減演算法、額度控制，全部可以直接搬到 Express 或 Fastify 裡跑。Route handler 只是一層薄殼：認證、驗參數、呼叫 lib、回傳。
>
> 所以我沒有『不分離』，我是**分離了關注點，但不分離部署拓撲**。分離部署要付的成本這個階段收不回來。」

講完這句，「你是不是不懂分層」的疑慮就沒了，剩下只是取捨討論——那是主場。
（可驗證：`grep -rl "react\|next/" src/lib src/db` 只會命中 `auth-client.ts`。）

### 為什麼不分離部署（按說服力排序）

1. **只有一個 client** — 前後分離最主要的價值是「一份後端服務多端」（web + iOS + Android + 第三方 API）。這裡只有 web，分出去的後端只有一個消費者，等於為不存在的需求付架構稅。
2. **一個人開發** — 另一個價值是團隊邊界（前後端組並行、各自發版）。單人開發時分離只是製造自己跟自己協作的成本：兩個 repo、兩份 CI、本地起兩個服務、改一個欄位要跨 repo 對齊。
3. **型別直通，零 DTO** — Drizzle schema type 一路穿到 component props，中間沒有手寫 DTO 或 codegen。分離後這條線會斷，要嘛維護兩份型別（會漂移），要嘛引入 OpenAPI/tRPC 補回來——等於用工具把剛拆掉的東西黏回去。
4. **串流體驗會變複雜** — `useChat` ↔ `streamText` 是 AI SDK 同一套協議，前端收到的不只文字，還有 `onData` 夾帶的下一題（自訂 data part）。跨服務要自己重刻 SSE protocol，或多一層 proxy 轉發串流——多一跳延遲，對逐字輸出是直接的體感損失。
5. **後端形狀本來就不需要獨立** — 這裡的後端在做 LLM 編排 + CRUD，沒有重運算、沒有背景 worker、沒有跨語言生態需求。連程式碼執行都用 Sandpack 在瀏覽器跑，**連沙箱後端都不需要**。沒有任何一塊有獨立的 runtime 或 scale 曲線。

### 三個常見反問

| 反問 | 回答 |
| --- | --- |
| 以後要做 App 怎麼辦？ | Route handler 本來就是標準 HTTP API，App 直接打同一組 endpoint，只是認證從 cookie 換 token。真要獨立服務，搬的是 `src/lib` + `src/db`，那層跟框架無關——遷移成本已經先付掉了。 |
| 後端不能獨立 scale 吧？ | Vercel Functions 是 per-route 獨立 scale，跑 LLM 的 route 單獨設 `maxDuration = 300`，跟其他 route 互不影響。不是傳統單體 app server 那種整包一起長的模型。 |
| 這樣算會後端嗎？ | 前後端的邊界不在部署拓撲，在誰持有 DB 連線和商業邏輯。`DATABASE_URL`、`AI_GATEWAY_API_KEY` 只存在 server；judge 邏輯、rubric 判定、掌握度計算全在 server 跑，client 只負責顯示。這些就是後端工作，只是跟前端同一份部署。 |

### 反手證明這是判斷不是無知（很加分）

主動說出**什麼時候會選分離**：

> 「有這幾種情況我會拆：多個 client 共用後端、需要長時間運行的 worker（例如批次生成課綱）、團隊大到前後端要各自排程發版、或某塊邏輯用別的語言明顯更好（例如 Python 的評測 pipeline）。目前一個都不成立，拆了只有成本沒有收益。這是現在的判斷，不是永久的。」

### 一句話版本（時間不夠時用）

> 「邏輯層本來就是分離的——`src/lib` 是純 TS，不依賴 React。我只是不分開部署，因為只有一個 client、一個開發者，分離要付的兩份部署、型別重複、串流跨服務的成本，這階段收不回來。要拆的時候搬 `src/lib` 就好。」

---

## 9. 誠實面對的弱點（先講贏過被抓）

- **這個專案的後端複雜度在「LLM 流程編排」與「狀態機設計」，不在「系統架構」**。分散式、訊息佇列、DB 調優、微服務這些沒碰到。
- **沒有 e2e 測試**，瀏覽器層靠手動驗證。
- **課綱只有一條路徑**（React Junior → Mid，2 個 Unit、24 個節點），廣度未經驗證。
- **LangGraph 目前偏重**——圖還小，是為未來擴充付的前置成本。

被問到時直接承認 + 說明取捨，不要硬撐。承認弱點的候選人比宣稱沒有弱點的可信。

---

## 10. 目前進度

| 階段 | 內容 | 狀態 |
| --- | --- | --- |
| C0 | Next.js + Drizzle + Better Auth + Vercel | ✅ |
| C1 | 技能樹資料層（schema 主題無關 + React 課綱 seed） | ✅ |
| C2 | 技能樹地圖 UI（三態節點、GSAP、標記已會） | ✅ |
| C3 | LangGraph.js 學習循環 | ✅ |
| C4 | 實作型節點（Sandpack + 測試 + AI code review） | ✅ |
| C4.5 / C4.6 | 小單元制、混合題型、課綱粒度重構（12 → 24 節點） | ✅ |
| C5 | 掌握度衰減、節點裂開、弱點導向複習佇列 | ✅ |
| C6.1–C6.3 | 視覺打磨、Landing page | ✅ |

規格與變更提案在 `openspec/`，完整編排見 `roadmap.md`。




9  6 
老闆  行銷/SEO. 後端(請育嬰假) 設計師 前端x2 

PM 6月底

技術主管 七月底 

前端前輩   