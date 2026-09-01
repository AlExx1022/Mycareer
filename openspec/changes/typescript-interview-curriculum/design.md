# typescript-interview-curriculum 設計

## Context

TypeScript Handbook 與 roadmap.sh 涵蓋 library author、進階型別與歷史語法，不能直接等同 Junior Frontend 面試綱要。本路徑以官方 Handbook 的 everyday types、narrowing、generics、type compatibility 與 React 官方 TypeScript 指引為主，裁掉型別體操。

參考來源：

- TypeScript Handbook：<https://www.typescriptlang.org/docs/handbook/2/everyday-types.html>
- Narrowing：<https://www.typescriptlang.org/docs/handbook/2/narrowing.html>
- Type Compatibility：<https://www.typescriptlang.org/docs/handbook/type-compatibility.html>
- Generics：<https://www.typescriptlang.org/docs/handbook/generics.html>
- React Using TypeScript：<https://react.dev/learn/typescript>
- roadmap.sh TypeScript：<https://roadmap.sh/typescript>

[Speculation] 公開資料沒有可信的 Junior TypeScript 題目頻率統計；P0 範圍以「能防止真實 React / API bug」與「面試可用短程式追問」為排序依據。

## Goals / Non-Goals

**Goals:**

- 使用者能說明 TypeScript 是靜態分析且型別會被擦除。
- 能用 `unknown`、narrowing、strict null 與 discriminated union 建模外部資料和 UI state。
- 能撰寫有實際型別關係的基本 generic，並使用 `keyof`、indexed access 與常用 utility types。
- 能為 React props、state、event、ref 與 API boundary 建立可維護型別。

**Non-Goals:**

- TypeScript 初學者重學 JavaScript runtime semantics。
- library author、compiler internals、完整 `.d.ts` 撰寫與 type challenge 路線。
- 以複雜型別取代 runtime validation。
- 重教 React state、event propagation、effect 或 data fetching 行為。

## Decisions

### D1：固定為 3 Unit、18 Lesson

#### Unit 1：型別系統心智模型（6 concept + 1 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `ts-compile-time-runtime-erasure` | Compile Time、Runtime 與型別擦除 | 解釋 TS 不改變 runtime 行為，interface / assertion 不會存在於輸出 JS |
| `ts-inference-annotation-boundaries` | 型別推論與標註邊界 | local value 優先推論，函式與外部 API boundary 才主動設 contract |
| `ts-everyday-value-shapes` | Primitive、Array、Tuple 與 Object Shape | 避免 wrapper types，分辨 array / tuple、required / optional / readonly |
| `ts-any-unknown-never-void` | any、unknown、never 與 void | 說明 assignability 與安全邊界，不用 `any` 關閉問題 |
| `ts-strict-nullability` | null、undefined 與 Optional | 在 strict null 下處理缺值，不濫用 non-null assertion |
| `ts-assertions-runtime-validation` | Assertion 不等於 Validation | 指出 `as User` 為何不能證明 JSON，選擇 guard / parser boundary |
| `ts-unsafe-any-clinic` | 實作：移除危險 any | 修復 JSON、catch error、nullable DOM 與 callback contract，不得 `as any` |

#### Unit 2：資料形狀與狀態建模（6 concept + 1 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `ts-type-interface-structural-typing` | Type、Interface 與 Structural Typing | 說明共同能力、extension / merging 邊界與 excess property check |
| `ts-function-contracts` | Function 與 Callback Contract | 正確標註參數、return、optional / rest，避免錯解 optional callback parameter |
| `ts-literal-union-modeling` | Literal、Union 與 Intersection | 用有限 union 表達狀態，能讀懂 intersection 且不製造不可能 shape |
| `ts-built-in-narrowing` | 內建 Type Guards 與 Control Flow | 使用 `typeof` / `in` / `instanceof` / `Array.isArray`，避免 truthiness 漏掉合法值 |
| `ts-discriminated-union-never` | Discriminated Union 與 Exhaustiveness | 用共同 discriminant 排除非法狀態，使用 `never` 發現漏分支 |
| `ts-generics-relationships-constraints` | Generics 的關係與 Constraints | generic 必須保留 input / output 關係；會寫基本 `extends` constraint |
| `ts-async-state-machine-lab` | 實作：Async State Machine | 將 loading / error / data booleans 改為 discriminated union 並 exhaustive render |

#### Unit 3：衍生型別與 React 邊界（3 concept + 1 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `ts-keyof-indexed-access` | keyof、typeof 與 Indexed Access | 從現有 object / constant 衍生 key 與 value types，避免雙份定義 |
| `ts-core-utility-types` | 常用 Utility Types | 正確選 `Partial` / `Required` / `Readonly` / `Pick` / `Omit` / `Record` |
| `ts-react-typed-boundaries` | React Props、State、Event、Ref 與 API Boundary | 善用 inference；處理 children、currentTarget、nullable ref 與 unknown response |
| `ts-typed-data-page-capstone` | 實作：Typed Data Page | runtime validate unknown response，以 exhaustive state 渲染 typed React page |

### D2：不重教 JavaScript 與 React

- JavaScript path 負責 coercion、closure、object reference、Promise、ESM、DOM event runtime 行為。
- TypeScript path 只回答「型別系統如何描述或限制這個行為」。
- React path 負責 props / state / hooks / effect 行為；TypeScript 第三 Unit 只處理型別表達。

每個 TypeScript concept intro 都必須連到建議前置 lesson，但不得複製完整教學。若使用者缺少 runtime 理解，提供返回建議，不在 TS rubric 放行錯誤心智模型。

### D3：`strict` 是所有範例基準

所有 vanilla-ts / react-ts 題目以 strict type checking 為基準；實作測試至少包含 `tsc --noEmit` 等價的 compile gate。runtime tests 通過但 typecheck 失敗不得送 AI review。

不要求背誦全部 tsconfig options；核心只需理解 `strict`、`noEmit`、`target`、`module` / `moduleResolution` 的責任，其中後三者放 follow-up 或題目 context，不另占 lesson。

### D4：API boundary 必須同時驗 runtime 與 compile time

`ts-typed-data-page-capstone` 的 starter response 型別為 `unknown`。學生必須經 runtime guard / parser 後才能進 typed state；直接 assertion、`any` 或 hard-code 測資由 AI review 判 fail，即使畫面與 tests 看似通過。

## Risks / Trade-offs

- [15 個 concept 仍可能過度濃縮] → 每節點只保留 2–3 examPoints；tsconfig 與第三方 declarations 留作 follow-up，不進核心節點。
- [typecheck 無法由既有 Sandpack test 狀態準確表示] → foundation runtime adapter 需暴露 compile diagnostics；本 change 在 task 中先加 compile gate fixture。
- [React 邊界節點太廣] → 只驗收 inference 原則與四個常見 boundary；複雜 generic component 留到 Mid 延伸。
- [學生用 assertion 逃過題目] → blueprint 禁用 `any` / unchecked assertion，AI review 對 runtime validation 作獨立 rubric。

