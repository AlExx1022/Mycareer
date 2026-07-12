import type { RubricItem } from "@/db/skill-tree-schema";

// 課綱：React Junior → Mid（第一條策展路徑）
// ⚠️ 考點與 rubric 文字為草稿骨架，依 roadmap 由作者人工策展審訂——
// 結構（Unit / 節點切分、依賴關係）為定稿，文字內容請作者修改後重跑 db:seed。

export type CurriculumLesson = {
  slug: string;
  title: string;
  type: "concept" | "practice";
  dependsOn: string[];
  examPoints: string[];
  rubric: RubricItem[];
};

export type CurriculumUnit = {
  slug: string;
  title: string;
  lessons: CurriculumLesson[];
};

export const curriculum: CurriculumUnit[] = [
  {
    slug: "react-core-model",
    title: "React 核心心智模型",
    lessons: [
      {
        slug: "jsx-and-rendering",
        title: "JSX 與渲染模型",
        type: "concept",
        dependsOn: [],
        examPoints: [
          "JSX 編譯成什麼、為什麼不是 HTML",
          "render 與 commit 的分別",
          "為什麼直接改 DOM 會和 React 打架",
        ],
        rubric: [
          {
            criterion: "能解釋 JSX 的本質",
            passCondition: "說出 JSX 是 createElement/jsx 呼叫的語法糖，產出的是描述 UI 的物件而非 DOM",
          },
          {
            criterion: "能描述重新渲染的觸發與流程",
            passCondition: "說出 state 改變觸發 re-render、React 比對後才更新 DOM",
          },
        ],
      },
      {
        slug: "components-and-props",
        title: "元件與 Props",
        type: "concept",
        dependsOn: ["jsx-and-rendering"],
        examPoints: [
          "props 單向資料流",
          "props 是唯讀的，為什麼",
          "children 與組合",
        ],
        rubric: [
          {
            criterion: "能解釋單向資料流",
            passCondition: "說出資料由父到子、子元件透過 callback 向上通知",
          },
          {
            criterion: "能運用 children 做組合",
            passCondition: "舉出用 children 取代重複結構的例子",
          },
        ],
      },
      {
        slug: "state-and-events",
        title: "State 與事件",
        type: "concept",
        dependsOn: ["components-and-props"],
        examPoints: [
          "useState 的更新是非同步批次的",
          "state 不可直接變異（immutability）",
          "函式型更新 setX(prev => ...) 的使用時機",
        ],
        rubric: [
          {
            criterion: "能解釋 state 更新的批次行為",
            passCondition: "說出連續 setState 同值問題，並用函式型更新修正",
          },
          {
            criterion: "能說明為什麼要 immutable 更新",
            passCondition: "說出 React 以參照相等判斷變化，直接 mutate 不會觸發 re-render",
          },
        ],
      },
      {
        slug: "conditional-and-lists",
        title: "條件渲染與列表",
        type: "concept",
        dependsOn: ["state-and-events"],
        examPoints: [
          "key 的作用與為什麼不能用 index",
          "條件渲染的常見寫法與 && 的陷阱",
        ],
        rubric: [
          {
            criterion: "能解釋 key 的用途",
            passCondition: "說出 key 幫助 React 辨識列表項目身分，錯誤 key 導致 state 錯位的例子",
          },
          {
            criterion: "能指出 && 渲染的陷阱",
            passCondition: "說出 0 && <X/> 會渲染出 0，並給出修正",
          },
        ],
      },
      {
        slug: "controlled-forms",
        title: "實作：受控表單",
        type: "practice",
        dependsOn: ["state-and-events"],
        examPoints: [
          "受控 vs 非受控元件",
          "多欄位表單的 state 設計",
        ],
        rubric: [
          {
            criterion: "表單完全受控",
            passCondition: "所有欄位值來自 state、onChange 更新，通過提供的測試",
          },
          {
            criterion: "驗證與錯誤訊息",
            passCondition: "空值與格式錯誤有對應錯誤訊息",
          },
        ],
      },
      {
        slug: "component-composition",
        title: "實作：元件拆分與組合",
        type: "practice",
        dependsOn: ["components-and-props", "conditional-and-lists"],
        examPoints: [
          "何時拆元件、props 介面設計",
          "lifting state up",
        ],
        rubric: [
          {
            criterion: "合理的元件邊界",
            passCondition: "把單一大元件拆成可重用小元件，props 介面清晰",
          },
          {
            criterion: "state 放對位置",
            passCondition: "共享 state 提升到正確的共同父層",
          },
        ],
      },
    ],
  },
  {
    slug: "hooks-and-data-flow",
    title: "Hooks 與資料流",
    lessons: [
      {
        slug: "useeffect-lifecycle",
        title: "useEffect 與生命週期",
        type: "concept",
        dependsOn: ["state-and-events"],
        examPoints: [
          "dependency array 的語意",
          "cleanup function 何時執行",
          "effect 常見誤用：把它當 watch 用",
        ],
        rubric: [
          {
            criterion: "能解釋 dependency array",
            passCondition: "說出空陣列、有依賴、無陣列三種情況的執行時機",
          },
          {
            criterion: "能正確使用 cleanup",
            passCondition: "舉出訂閱/計時器需要 cleanup 的例子與執行順序",
          },
        ],
      },
      {
        slug: "closure-and-stale-state",
        title: "Closure 與 Stale State",
        type: "concept",
        dependsOn: ["useeffect-lifecycle"],
        examPoints: [
          "closure 如何造成 effect/callback 讀到舊 state",
          "解法：函式型更新、正確依賴、ref",
        ],
        rubric: [
          {
            criterion: "能診斷 stale closure",
            passCondition: "看 setInterval 讀舊 state 的程式碼，指出原因",
          },
          {
            criterion: "能給出至少兩種解法",
            passCondition: "說出函式型更新與補依賴（或 ref）並比較取捨",
          },
        ],
      },
      {
        slug: "custom-hooks",
        title: "Custom Hooks",
        type: "concept",
        dependsOn: ["useeffect-lifecycle"],
        examPoints: [
          "hooks 的規則與為什麼",
          "何時抽 custom hook、回傳介面設計",
        ],
        rubric: [
          {
            criterion: "能解釋 hooks 規則",
            passCondition: "說出只能在頂層呼叫的原因（呼叫順序即身分）",
          },
          {
            criterion: "能設計 custom hook",
            passCondition: "把重複的訂閱/請求邏輯抽成 hook，介面合理",
          },
        ],
      },
      {
        slug: "usememo-usecallback",
        title: "useMemo 與 useCallback",
        type: "concept",
        dependsOn: ["closure-and-stale-state", "custom-hooks"],
        examPoints: [
          "參照相等與 re-render 的關係",
          "何時該用、何時是過早優化",
        ],
        rubric: [
          {
            criterion: "能解釋 memoization 的觸發點",
            passCondition: "說出 props 參照變化導致子元件 re-render，memo + useCallback 如何配合",
          },
          {
            criterion: "能判斷使用時機",
            passCondition: "舉出不需要 useMemo 的例子並說明成本",
          },
        ],
      },
      {
        slug: "debounce-hook",
        title: "實作：useDebounce",
        type: "practice",
        dependsOn: ["closure-and-stale-state", "custom-hooks"],
        examPoints: [
          "debounce 原理與 cleanup",
          "泛型 hook 介面",
        ],
        rubric: [
          {
            criterion: "行為正確",
            passCondition: "值在間隔內連續變化只觸發最後一次，通過提供的測試",
          },
          {
            criterion: "無記憶體洩漏",
            passCondition: "unmount 與值變化時正確清除計時器",
          },
        ],
      },
      {
        slug: "data-fetching-pattern",
        title: "實作：資料請求模式",
        type: "practice",
        dependsOn: ["custom-hooks", "conditional-and-lists"],
        examPoints: [
          "loading / error / data 三態",
          "race condition 與請求取消",
        ],
        rubric: [
          {
            criterion: "三態完整",
            passCondition: "UI 正確呈現 loading、error、data 三種狀態",
          },
          {
            criterion: "處理 race condition",
            passCondition: "快速切換查詢時不顯示過期結果（ignore flag 或 AbortController）",
          },
        ],
      },
    ],
  },
];
