# javascript-interview-curriculum 設計

## Context

roadmap.sh JavaScript 2026 的完整範圍遠超 Junior 面試需要；MDN JavaScript Guide 則是語言參考，不提供求職優先順序。本課綱取兩者與公開 Frontend Interview Playbook 的重疊區，並以現有 React 課綱會實際依賴的 runtime 行為為裁切準則。

參考來源：

- roadmap.sh JavaScript Roadmap：<https://roadmap.sh/javascript>
- MDN JavaScript Guide：<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide>
- MDN Execution Model：<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop>
- GreatFrontEnd JavaScript Interview Guide：<https://www.greatfrontend.com/front-end-interview-playbook/javascript>

[Speculation] 公開資料沒有可信的台灣 Junior JavaScript 面試題頻率統計；優先級依「官方核心語意、公開面試題庫、React 實務前置」三者交集策展，不宣稱是統計排名。

## Goals / Non-Goals

**Goals:**

- 使用者能解釋 JavaScript 核心語意、預測短程式輸出、定位常見 bug，並完成 20–40 分鐘 Vanilla JS 實作。
- 一節點一概念，concept 約 5–10 分鐘；practice 對應可辨識的面試題型。
- 語法示例使用現代 JavaScript 與 ESM，但重點放在穩定心智模型而非追逐 ES 年份。
- 建立 TypeScript 與 React 路徑可引用的建議前置能力。

**Non-Goals:**

- 零程式經驗的完整 JavaScript 入門課。
- 完整 HTML / CSS、前端 system design 或 LeetCode 路線。
- ECMAScript abstract operation、engine optimization 或 metaprogramming 深入。
- 把每個 Array API、Promise combinator 或 2026 新語法拆成獨立節點。

## Decisions

### D1：固定為 5 Unit、28 Lesson

#### Unit 1：值、型別與比較（5 concept + 1 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `js-runtime-values-types` | JavaScript runtime、值與型別 | 分辨 ECMAScript 與 browser / Node host API；說出 primitive 與 object 差異 |
| `js-absent-values-type-checks` | undefined、null 與型別檢查 | 正確使用 `typeof`、`Array.isArray`、`instanceof`，辨認 undeclared |
| `js-truthiness-and-defaulting` | Truthy、Falsy 與預設值 | 解釋 `&&` / `||` 回傳 operand，正確選 `??` 避免吃掉 `0` / `""` |
| `js-coercion-and-equality` | Coercion 與相等比較 | 推理 `===` / `==` / `Object.is`、`NaN` 與常見隱式轉型 |
| `js-identity-mutation-copy` | 參照身分、Mutation 與 Shallow Copy | 解釋 binding 與 object mutation、spread 只複製第一層 |
| `js-output-reasoning-lab` | 實作：值與比較輸出推理 | 不執行程式先寫輸出與規則，再以測試驗證 |

#### Unit 2：Scope、Function 與 this（5 concept + 1 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `js-variable-scopes` | var、let、const 與作用域 | 比較 global / function / block / module scope 與 shadowing |
| `js-hoisting-and-tdz` | Hoisting 與 Temporal Dead Zone | 以 declaration / initialization 解釋結果，不使用「程式碼被搬動」心智模型 |
| `js-function-forms-and-callbacks` | 函式形式、First-class Function 與 Callback | 比較 declaration / expression / arrow；知道 callback 不等於 async |
| `js-lexical-scope-and-closure` | Lexical Scope 與 Closure | 解釋捕捉環境、factory、event handler 與 loop closure bug |
| `js-this-and-binding` | this、Arrow 與 bind | 由 call site 判定 `this`，比較 arrow、method、`call` / `apply` / `bind` |
| `js-closure-this-debug-lab` | 實作：Closure 與 this Debug | 修復遺失 context、late binding 與私有狀態問題 |

#### Unit 3：資料處理與 Object Model（4 concept + 1 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `js-array-method-contracts` | Array 迭代方法的契約 | 根據輸出需求選 `map` / `filter` / `find` / `some` / `every` / `reduce` |
| `js-mutating-array-apis` | Mutating 與 Non-mutating Array API | 辨認 `sort` / `splice` 污染，使用 copy 或 `toSorted` 等 immutable API |
| `js-map-set-data-selection` | Object、Map 與 Set 怎麼選 | 依 key 型別、唯一性、membership 與迭代需求選資料結構 |
| `js-prototype-chain-and-class` | Prototype Chain、new 與 Class | 解釋 property lookup、instance 與 class 是 prototype model 的語法層 |
| `js-data-transform-lab` | 實作：資料正規化與 groupBy | 處理空值、去重、分組、排序與 input immutability，說明 Big-O |

#### Unit 4：非同步 JavaScript（5 concept + 1 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `js-event-loop-tasks-microtasks` | Call Stack、Event Loop、Task 與 Microtask | 正確預測同步、Promise、timer 排序與 run-to-completion |
| `js-promise-chaining` | Promise 狀態與 Chaining | 說明 settlement、`.then` 回傳值與漏 return 的後果 |
| `js-promise-error-flow` | Promise 錯誤傳遞 | 正確安排 `catch` / `finally` / rethrow，不吞 rejection |
| `js-async-await-concurrency` | async/await 與並行等待 | 說明 async 回傳 Promise，區分 sequential 與 `Promise.all` concurrency |
| `js-async-race-and-cancellation` | 非同步 Race 與 Cancellation | 以 request identity 或 AbortController 防止舊結果覆蓋新結果 |
| `js-promise-concurrency-lab` | 實作：批次請求與錯誤策略 | 實作 sequential、fail-fast、partial-result 三版並比較取捨 |

#### Unit 5：Browser Integration（4 concept + 1 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `js-es-modules` | ES Modules | named / default export、module scope、strict mode、live binding |
| `js-error-boundaries-debugging` | Error Boundary 與 Debugging | 分辨同步／非同步錯誤邊界，讀 stack trace、使用 breakpoint 與 Network panel |
| `js-dom-events-delegation` | DOM、Event Propagation 與 Delegation | 操作 element、分辨 target / currentTarget、capture / bubble、表單預設行為 |
| `js-fetch-http-cors` | Fetch、HTTP Error 與 CORS | 檢查 `Response.ok`、JSON boundary、network vs HTTP error、CORS 基本責任邊界 |
| `js-autocomplete-capstone` | 實作：Autocomplete | 整合 debounce、DOM event、fetch、loading/error/empty、abort 與 latest-request-wins |

### D2：依賴採 Unit 主鏈，細節在 Unit 內線性解鎖

```text
值與型別 → Scope / Function / this → 資料處理 / Object
                                      ↓
                                  Async → Browser
```

每個 practice 依賴同 Unit 的核心 concepts；下一 Unit 依賴前一 Unit checkpoint。`javascript-interview-core` 是 TypeScript / React 的 recommended prerequisite，不以 `lesson_dependency` 跨 path 鎖定。

### D3：rubric 驗收三種訊號

每個 concept 至少包含兩條 rubric，合計覆蓋：

1. **Explain**：能用自己的話說出機制與適用邊界。
2. **Reason**：能在不執行程式的前提下預測結果或指出 root cause。
3. **Apply**：能提出最小修正、edge case 或 API / data structure 選擇理由。

不要求每個 lesson 都做完整 coding；Apply 可由互動讀碼題驗收。practice blueprint 則固定 timebox、輸入輸出、edge cases 與 follow-up。

### D4：現代語法只作為穩定 API 更新，不搶核心節點

`optional chaining`、`nullish coalescing`、`Promise.allSettled`、`AbortController`、`structuredClone`、`toSorted` / `toReversed` 等放進對應既有節點的 examPoints。Explicit Resource Management、iterator helpers、Set 新方法等不因「2026」單獨成課；待目標職缺或專案實際使用再進延伸路徑。

## Risks / Trade-offs

- [28 節點仍有學習壓力] → 每 Unit 以 practice 收束，路徑目錄顯示 Unit 級進度；不再擴充語法百科。
- [單節點內容過廣] → selfcheck 限制 2–3 個遞進 examPoints，author review 檢查每個 title 是否只有一個可口述主題。
- [面試題變成背輸出] → rubric 必須要求解釋規則與 root cause；practice 測試只驗證結果，AI review 驗證推理與可讀性。
- [與 React 課程重複] → JavaScript 負責 runtime 語意；React 課只引用 closure、immutability、async 的前置連結，不重寫教學內容。

