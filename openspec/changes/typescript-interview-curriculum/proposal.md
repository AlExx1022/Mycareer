# typescript-interview-curriculum

## Why

專案與履歷主打 TypeScript，但現有課綱只以 TypeScript 寫 React 範例，沒有驗收型別擦除、`unknown`、strict null、narrowing、discriminated union、generics 與 React 型別邊界。面試者可以「寫得動 TSX」卻無法說清楚 TypeScript 真正保證什麼。

本 change 在 JavaScript 核心路徑穩定後，新增一條不做型別體操、以 Junior Frontend 實務與面試為完成線的 TypeScript 路徑。

## What Changes

- 新增 `typescript-frontend-core` 路徑：3 Unit、18 Lesson（15 concept、3 practice）。
- 課程順序為「型別心智模型 → 資料與狀態建模 → Generics / React 邊界」。
- JavaScript 路徑列為建議前置，React 路徑作為第三 Unit 的實際應用上下文；兩者都不形成跨路徑 hard lock。
- practice 固定三類面試／工作題：移除危險 `any`、Discriminated Union Async State、Typed Data Page。
- TypeScript concept 明確區分 compile-time 與 runtime，不把 assertion 或 interface 當資料驗證。
- 不做：進階 conditional / mapped / recursive / template literal types、`infer` 體操、decorators、variance、declaration authoring、polymorphic component。

## Capabilities

### New Capabilities

- `typescript-interview-curriculum`: TypeScript Junior Frontend 面試核心路徑、React 交界與範圍限制。

### Modified Capabilities

（無；依賴既有多路徑與多 runtime 能力。）

## Impact

- **前置 changes**：`multi-path-learning-foundation`、`javascript-interview-curriculum`。
- **課綱**：新增 `src/db/curriculum/typescript-frontend-core.ts` 並加入 aggregate。
- **DB**：無新 schema；path-scoped seed 新增 TypeScript path 與依賴。
- **實作 runtime**：使用 foundation 的 `vanilla-ts`；React 整合 capstone 仍採 `react-ts` lesson override。
- **文件 / UI**：路徑目錄、readme 與衍生統計新增 TypeScript 路徑。

