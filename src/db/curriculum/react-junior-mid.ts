import type { CurriculumPath, CurriculumUnit } from "./types";

export type { CurriculumLesson, CurriculumUnit } from "./types";

// 課綱：React Junior → Mid（第一條策展路徑）
// ⚠️ C4.6 重策展草稿（一節點一概念）——intro、考點與 rubric 文字待作者人工審訂，
// 結構（Unit / topic / 節點切分、依賴關係）為定稿，文字內容請作者修改後重跑 db:seed。
// 考點依難度遞進排序：第 1 點直覺認識 → 第 2 點原理理解 → 第 3 點深入/常見誤解。

const units: CurriculumUnit[] = [
  {
    slug: "react-core-model",
    title: "React 核心心智模型",
    lessons: [
      // ── topic: JSX 與渲染 ──
      {
        slug: "jsx-compiles-to-what",
        title: "JSX 編譯成什麼",
        type: "concept",
        topic: "JSX 與渲染",
        dependsOn: [],
        intro: {
          hook: "你在 React 裡寫的 <h1>Hello</h1>，瀏覽器其實完全看不懂——那專案為什麼跑得起來？",
          scenarios: [
            "面試必考題：「JSX 是什麼？它跟 HTML 差在哪？」",
            "build 錯誤訊息出現 jsx-runtime 或 React.createElement 時，知道問題出在編譯層",
          ],
          outcome: "能解釋一段 JSX 從原始碼到 JS 物件的完整過程",
        },
        examPoints: [
          "JSX 是語法糖：瀏覽器不認得，要先經過 Babel/SWC 編譯",
          "編譯產物是 createElement/jsx 函式呼叫，回傳描述 UI 的 JavaScript 物件",
          "因為本質是 JS，才能用 {} 嵌表達式；JSX 不是 HTML 也不是字串",
        ],
        rubric: [
          {
            criterion: "能解釋 JSX 的本質",
            passCondition: "說出 JSX 是 createElement/jsx 呼叫的語法糖，產出的是描述 UI 的物件而非 DOM",
          },
        ],
      },
      {
        slug: "render-and-commit",
        title: "render 與 commit",
        type: "concept",
        topic: "JSX 與渲染",
        dependsOn: ["jsx-compiles-to-what"],
        intro: {
          hook: "元件函式被呼叫，就代表畫面更新了嗎？其實中間還隔著一步。",
          scenarios: [
            "debug 時分辨「元件有執行」和「DOM 有更新」是兩回事",
            "面試題：「setState 之後到畫面更新，中間發生了什麼？」",
          ],
          outcome: "能分辨 render（算出新畫面）與 commit（套用到 DOM）兩個階段",
        },
        examPoints: [
          "render 階段：React 呼叫元件函式，算出「畫面應該長怎樣」",
          "commit 階段：React 比對新舊結果，只把差異更新到 DOM",
          "render 不等於 DOM 更新——元件執行了，畫面可能一格都沒動",
        ],
        rubric: [
          {
            criterion: "能描述重新渲染的觸發與流程",
            passCondition: "說出 state 改變觸發 re-render、React 比對後才更新 DOM",
          },
        ],
      },
      {
        slug: "why-not-touch-dom",
        title: "為什麼不直接改 DOM",
        type: "concept",
        topic: "JSX 與渲染",
        dependsOn: ["render-and-commit"],
        intro: {
          hook: "明明 document.querySelector 一行就能改畫面，React 為什麼不讓你這樣做？",
          scenarios: [
            "接手混了 jQuery 的舊 React 專案，畫面莫名錯亂",
            "面試題：「宣告式和命令式 UI 差在哪？」",
          ],
          outcome: "能說明 React 接管 DOM 的理由，以及手改 DOM 會發生什麼事",
        },
        examPoints: [
          "React 的宣告式模型：你描述畫面長怎樣，DOM 操作交給 React",
          "手改 DOM 後，React 下次 commit 會把你的修改蓋掉或造成錯位",
          "真的需要碰 DOM 時的正規出口：ref",
        ],
        rubric: [
          {
            criterion: "能解釋 React 接管 DOM 的理由",
            passCondition: "說出手改 DOM 與 React 更新衝突的具體後果，並知道 ref 是正規出口",
          },
        ],
      },
      // ── topic: 元件與 Props ──
      {
        slug: "one-way-data-flow",
        title: "單向資料流",
        type: "concept",
        topic: "元件與 Props",
        dependsOn: ["why-not-touch-dom"],
        intro: {
          hook: "為什麼子元件不能直接把資料「塞回去」給父元件？這個限制其實是 React 最好用的地方。",
          scenarios: [
            "設計元件時決定資料該放在哪一層、往哪個方向流",
            "debug 資料異常時，只要沿著 props 往上找源頭",
          ],
          outcome: "能畫出資料由父到子、事件由子到父的完整迴路",
        },
        examPoints: [
          "資料由父到子單向流動，props 是唯一入口",
          "子元件要影響父層，靠父層傳下來的 callback",
          "單向流的好處：資料來源唯一，bug 沿一條線就能追到",
        ],
        rubric: [
          {
            criterion: "能解釋單向資料流",
            passCondition: "說出資料由父到子、子元件透過 callback 向上通知",
          },
        ],
      },
      {
        slug: "props-are-readonly",
        title: "Props 唯讀",
        type: "concept",
        topic: "元件與 Props",
        dependsOn: ["one-way-data-flow"],
        intro: {
          hook: "直接改 props.value 有時看起來能跑——為什麼它還是地雷？",
          scenarios: [
            "code review 抓出「改 props」造成的畫面與資料脫鉤",
            "面試題：「props 和 state 差在哪？什麼時候用哪個？」",
          ],
          outcome: "能說明 props 唯讀的原因，分清 props 與 state 的分工",
        },
        examPoints: [
          "props 是父層給的參數，子元件只能讀不能改",
          "改 props 不會觸發 re-render，畫面和資料從此脫鉤",
          "需要變動的資料是 state；用 props 初始化 state 的同步陷阱",
        ],
        rubric: [
          {
            criterion: "能解釋 props 唯讀",
            passCondition: "說出改 props 不觸發更新、需要變動的資料應改用 state",
          },
        ],
      },
      {
        slug: "children-composition",
        title: "children 與組合",
        type: "concept",
        topic: "元件與 Props",
        dependsOn: ["props-are-readonly"],
        intro: {
          hook: "卡片、彈窗、版型長得都一樣，只有中間內容不同——難道要寫十個幾乎重複的元件？",
          scenarios: [
            "做出 Card、Modal 這類「殼」元件在整個專案重複使用",
            "讀懂 UI 庫文件裡 children 與 slot 的用法",
          ],
          outcome: "能用 children 做出可組合的容器元件",
        },
        examPoints: [
          "children：包在標籤中間的內容，會變成一個特殊的 prop",
          "組合模式：外殼元件負責版型，內容由呼叫端決定",
          "組合優先於複製貼上；用 props 傳 JSX 做出具名插槽",
        ],
        rubric: [
          {
            criterion: "能運用 children 做組合",
            passCondition: "舉出用 children 取代重複結構的例子",
          },
        ],
      },
      // ── topic: State 與事件 ──
      {
        slug: "usestate-batching",
        title: "useState 批次更新",
        type: "concept",
        topic: "State 與事件",
        dependsOn: ["children-composition"],
        intro: {
          hook: "同一個事件裡連呼三次 setCount(count + 1)，畫面卻只加了 1——這不是 bug，是 React 的設計。",
          scenarios: [
            "debug「setState 之後馬上讀 state，怎麼還是舊值」",
            "面試經典題：連續 setState 的輸出預測",
          ],
          outcome: "能解釋 state 更新為什麼是非同步批次，並正確預測輸出",
        },
        examPoints: [
          "setState 不會立刻改值，React 會收集起來批次處理",
          "同一輪事件裡連續 setCount(count + 1)，每次讀到的都是同一個舊值",
          "要用更新後的值：在下一次 render 拿，不是 setState 完馬上讀",
        ],
        rubric: [
          {
            criterion: "能解釋 state 更新的批次行為",
            passCondition: "說出連續 setState 讀到同一個舊值的原因與批次處理機制",
          },
        ],
      },
      {
        slug: "state-immutability",
        title: "State 不可變",
        type: "concept",
        topic: "State 與事件",
        dependsOn: ["usestate-batching"],
        intro: {
          hook: "array.push 之後資料明明變了，畫面卻一動也不動——React 為什麼裝沒看到？",
          scenarios: [
            "debug「改了物件/陣列但畫面不更新」的經典問題",
            "code review 抓出直接 mutate state 的寫法",
          ],
          outcome: "能用展開複製等 immutable 寫法正確更新物件與陣列",
        },
        examPoints: [
          "React 用參照相等（Object.is）判斷 state 有沒有變",
          "直接 mutate 參照沒變，React 認定沒事發生、跳過更新",
          "正確姿勢：展開複製建立新物件/新陣列再 setState",
        ],
        rubric: [
          {
            criterion: "能說明為什麼要 immutable 更新",
            passCondition: "說出 React 以參照相等判斷變化，直接 mutate 不會觸發 re-render",
          },
        ],
      },
      {
        slug: "functional-updates",
        title: "函式型更新",
        type: "concept",
        topic: "State 與事件",
        dependsOn: ["state-immutability"],
        intro: {
          hook: "setCount(count + 1) 和 setCount(c => c + 1) 只差一個箭頭，行為卻天差地遠。",
          scenarios: [
            "修「連點按鈕卻只加一次」的 bug",
            "在 setInterval 或非同步 callback 裡安全地更新 state",
          ],
          outcome: "能判斷什麼時候必須用函式型更新",
        },
        examPoints: [
          "函式型更新：把「拿最新值來算」這件事交給 React",
          "連續多次更新同一個 state 時，函式型保證不吃舊值",
          "判斷時機：新值依賴前值就用函式型，否則一般寫法即可",
        ],
        rubric: [
          {
            criterion: "能正確使用函式型更新",
            passCondition: "用 setX(prev => ...) 修正連續更新吃舊值的問題，並說明使用時機",
          },
        ],
      },
      // ── topic: 條件渲染與列表 ──
      {
        slug: "list-keys",
        title: "列表與 key",
        type: "concept",
        topic: "條件渲染與列表",
        dependsOn: ["functional-updates"],
        intro: {
          hook: "console 跳出 missing key 警告，隨手塞個 index 消音——然後 bug 就這樣埋下了。",
          scenarios: [
            "列表增刪排序後，輸入框內容「跑到別列去」的靈異現象",
            "面試題：「為什麼 key 不建議用 index？」",
          ],
          outcome: "能說明 key 的用途，並為列表選出正確的 key",
        },
        examPoints: [
          "key 是列表項目的身分證，幫 React 認出誰是誰",
          "用 index 當 key，增刪排序時身分錯亂、state 錯位",
          "正確選 key：穩定且唯一的 id；純展示的靜態列表 index 才勉強可用",
        ],
        rubric: [
          {
            criterion: "能解釋 key 的用途",
            passCondition: "說出 key 幫助 React 辨識列表項目身分，並舉出錯誤 key 導致 state 錯位的例子",
          },
        ],
      },
      {
        slug: "conditional-rendering-pitfalls",
        title: "條件渲染與 && 陷阱",
        type: "concept",
        topic: "條件渲染與列表",
        dependsOn: ["list-keys"],
        intro: {
          hook: "畫面上莫名其妙多了一個 0——你大概寫了 count && <List />。",
          scenarios: [
            "修「畫面出現 0」這個 React 圈最經典的小 bug",
            "依 loading 狀態或權限切換畫面區塊",
          ],
          outcome: "能選對條件渲染寫法，避開 falsy 值陷阱",
        },
        examPoints: [
          "三種常見寫法：&&、三元運算子、提早 return",
          "&& 的陷阱：左邊是 0 或 NaN 時會被直接渲染出來",
          "修正：轉成布林（!!、> 0）或改用三元運算子",
        ],
        rubric: [
          {
            criterion: "能指出 && 渲染的陷阱",
            passCondition: "說出 0 && <X/> 會渲染出 0，並給出修正",
          },
        ],
      },
      // ── 實作節點 ──
      {
        slug: "controlled-forms",
        title: "實作：受控表單",
        type: "practice",
        topic: "受控表單",
        dependsOn: ["functional-updates"],
        practiceRuntime: "react-ts",
        practiceBlueprint: {
          objective: "實作一個全程由 React state 驅動、會即時驗證的多欄位表單。",
          requirements: [
            "所有可編輯欄位的 value 均來自 state，onChange 只透過 state 更新表單",
            "使用單一表單 state 處理至少兩個命名欄位，不直接操作 DOM",
            "送出時驗證必填與格式，並在對應欄位旁顯示可辨識的錯誤訊息",
            "驗證通過時呼叫提供的 submit callback，傳入當前表單資料",
          ],
          edgeCases: [
            "只含空白字元的必填值應視為空值",
            "錯誤後修正欄位再送出，錯誤訊息必須正確清除",
            "連續編輯不得丟失其他欄位的值",
          ],
          starterSignature:
            "export default function ControlledForm({ onSubmit }: ControlledFormProps): JSX.Element",
          timeboxMinutes: 35,
          followUps: [
            "如何在不產生 race condition 的前提下加入非同步驗證？",
            "欄位增加到十個以上時，你會如何調整 state 與 validation 設計？",
          ],
        },
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
        topic: "元件拆分",
        dependsOn: ["children-composition", "conditional-rendering-pitfalls"],
        practiceRuntime: "react-ts",
        practiceBlueprint: {
          objective: "將單體 React 介面重構為可組合元件，並把共用 state 放在正確層級。",
          requirements: [
            "將反覆的外觀與內容拆成至少兩個職責單一的元件",
            "容器使用 children 或明確的 JSX prop 接收內容，不以複製結構處理變體",
            "多個子元件共用的 state 由最近共同父層持有，子元件透過 callback 發出事件",
            "props 介面保持最小且具有明確 TypeScript 型別",
          ],
          edgeCases: [
            "空資料時應顯示空狀態而非空白區塊",
            "任一子元件發出事件後，所有相關元件應顯示一致資料",
            "可選內容缺少時不得產生 runtime error",
          ],
          starterSignature:
            "export default function Dashboard({ items }: DashboardProps): JSX.Element",
          timeboxMinutes: 40,
          followUps: [
            "哪些情況會讓你改用 Context，而不再繼續提升 state？",
            "如何在不過度拆分的前提下判斷元件邊界？",
          ],
        },
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
      // ── topic: useEffect 與生命週期 ──
      {
        slug: "effect-dependencies",
        title: "dependency array 的語意",
        type: "concept",
        topic: "useEffect 與生命週期",
        dependsOn: ["functional-updates"],
        intro: {
          hook: "空陣列、有依賴、不寫陣列——三種寫法的 effect 到底什麼時候跑？",
          scenarios: [
            "修「effect 沒跑」或「effect 狂跑」的問題",
            "面試題：「useEffect 的執行時機？空陣列代表什麼？」",
          ],
          outcome: "能準確預測三種 dependency 寫法的執行時機",
        },
        examPoints: [
          "effect 在 commit 之後執行，依賴陣列決定「哪些變化要重跑」",
          "三種情況：不寫陣列每次 render 後都跑、空陣列只跑一次、有依賴變了才跑",
          "依賴要誠實：effect 裡用到什麼就列什麼，漏列是 bug 溫床",
        ],
        rubric: [
          {
            criterion: "能解釋 dependency array",
            passCondition: "說出空陣列、有依賴、無陣列三種情況的執行時機",
          },
        ],
      },
      {
        slug: "effect-cleanup",
        title: "cleanup 的時機",
        type: "concept",
        topic: "useEffect 與生命週期",
        dependsOn: ["effect-dependencies"],
        intro: {
          hook: "訂閱了事件卻沒退訂，切換幾次頁面後 console 開始重複噴同一則訊息。",
          scenarios: [
            "計時器、事件訂閱、WebSocket 連線的正確清理",
            "理解 React StrictMode 下 effect 跑兩次在測什麼",
          ],
          outcome: "能寫出正確的 cleanup，並說出它何時執行",
        },
        examPoints: [
          "cleanup：effect 回傳的函式，負責把這輪 effect 做的事收乾淨",
          "執行時機：下一次 effect 執行之前，以及元件 unmount 時",
          "沒 cleanup 的後果：重複訂閱、計時器疊加、記憶體洩漏",
        ],
        rubric: [
          {
            criterion: "能正確使用 cleanup",
            passCondition: "舉出訂閱/計時器需要 cleanup 的例子與執行順序",
          },
        ],
      },
      {
        slug: "effect-misuse",
        title: "effect 的常見誤用",
        type: "concept",
        topic: "useEffect 與生命週期",
        dependsOn: ["effect-cleanup"],
        intro: {
          hook: "「state 一變就做某件事」——先等等，你可能根本不需要 useEffect。",
          scenarios: [
            "code review 抓出「用 effect 同步兩個 state」造成的多餘 render",
            "對照官方文件〈You Might Not Need an Effect〉重構舊程式",
          ],
          outcome: "能判斷什麼該進 effect、什麼直接在 render 或事件裡處理",
        },
        examPoints: [
          "effect 是給「與外部系統同步」用的，不是 state 的 watch",
          "反模式：用 effect 把 A state 算成 B state——render 時直接算就好",
          "事件觸發的邏輯放事件處理器，不要繞道 effect",
        ],
        rubric: [
          {
            criterion: "能辨識 effect 誤用",
            passCondition: "指出用 effect 當 watch 的問題，並以 render 時計算或事件處理改寫",
          },
        ],
      },
      // ── topic: Closure 與 Stale State ──
      {
        slug: "stale-closure-diagnosis",
        title: "stale closure 的成因",
        type: "concept",
        topic: "Closure 與 Stale State",
        dependsOn: ["effect-misuse"],
        intro: {
          hook: "setInterval 裡的 count 永遠是 0——程式沒壞，是 closure 記住了舊世界。",
          scenarios: [
            "修計時器或事件監聽器讀到舊 state 的 bug",
            "面試經典題：setInterval + useState 為什麼卡在 1",
          ],
          outcome: "能看出一段程式碼裡誰抓住了舊 state",
        },
        examPoints: [
          "每次 render 都是一個新的函式作用域，舊函式抓住的是舊變數",
          "effect 只跑一次時，裡面的 callback 永遠讀到第一輪的 state",
          "診斷路徑：問「這個函式是哪一輪 render 建立的？」",
        ],
        rubric: [
          {
            criterion: "能診斷 stale closure",
            passCondition: "看 setInterval 讀舊 state 的程式碼，指出原因",
          },
        ],
      },
      {
        slug: "stale-closure-fixes",
        title: "stale closure 的解法",
        type: "concept",
        topic: "Closure 與 Stale State",
        dependsOn: ["stale-closure-diagnosis"],
        intro: {
          hook: "知道是 closure 惹的禍之後——函式型更新、補依賴、ref，三條路你選哪條？",
          scenarios: [
            "實際修復計時器 bug，並在 code review 裡說明為什麼選這個解法",
          ],
          outcome: "能給出至少兩種解法，並比較適用場景",
        },
        examPoints: [
          "函式型更新：不讀外面的 state，直接跟 React 拿最新值",
          "補依賴：讓 effect 跟著 state 重建，callback 永遠是新的",
          "ref 出口：要「讀最新值但不想重跑 effect」時用 ref；三者的取捨",
        ],
        rubric: [
          {
            criterion: "能給出至少兩種解法",
            passCondition: "說出函式型更新與補依賴（或 ref）並比較取捨",
          },
        ],
      },
      // ── topic: Custom Hooks ──
      {
        slug: "rules-of-hooks",
        title: "Hooks 的規則",
        type: "concept",
        topic: "Custom Hooks",
        dependsOn: ["effect-misuse"],
        intro: {
          hook: "為什麼 hook 不能寫在 if 裡？這條規則不是官方任性，背後有個精巧的機制。",
          scenarios: [
            "看懂 eslint-plugin-react-hooks 的報錯在保護什麼",
            "面試題：「hooks 為什麼只能在頂層呼叫？」",
          ],
          outcome: "能說出 hooks 規則背後的運作機制",
        },
        examPoints: [
          "兩條規則：只在頂層呼叫、只在 React 函式裡呼叫",
          "機制：React 靠「呼叫順序」對應每個 hook 的 state",
          "放進 if/迴圈會讓順序錯位，state 張冠李戴",
        ],
        rubric: [
          {
            criterion: "能解釋 hooks 規則",
            passCondition: "說出只能在頂層呼叫的原因（呼叫順序即身分）",
          },
        ],
      },
      {
        slug: "extracting-custom-hooks",
        title: "抽出 Custom Hook",
        type: "concept",
        topic: "Custom Hooks",
        dependsOn: ["rules-of-hooks"],
        intro: {
          hook: "兩個元件都在訂閱視窗大小——複製貼上第三次之前，是時候抽一個 hook 了。",
          scenarios: [
            "把重複的訂閱/請求邏輯收成 useXxx 給全專案用",
            "讀懂開源專案裡一層層的 custom hooks",
          ],
          outcome: "能把重複邏輯抽成介面合理的 custom hook",
        },
        examPoints: [
          "custom hook 就是「會用到其他 hook 的函式」，命名以 use 開頭",
          "抽取時機：邏輯重複、而且裡面含 state 或 effect",
          "介面設計：參數與回傳值怎麼定，呼叫端才好用",
        ],
        rubric: [
          {
            criterion: "能設計 custom hook",
            passCondition: "把重複的訂閱/請求邏輯抽成 hook，介面合理",
          },
        ],
      },
      // ── topic: useMemo 與 useCallback ──
      {
        slug: "referential-equality-rerender",
        title: "參照相等與 re-render",
        type: "concept",
        topic: "useMemo 與 useCallback",
        dependsOn: ["stale-closure-fixes", "extracting-custom-hooks"],
        intro: {
          hook: "明明傳「一樣」的資料，子元件卻每次都重渲染——因為「一樣」不是你以為的一樣。",
          scenarios: [
            "用 React DevTools 追「這個元件為什麼又 render 了」",
            "面試題：「React.memo 為什麼失效？」",
          ],
          outcome: "能解釋物件/函式 props 為何每輪都是新參照，以及它的連鎖效應",
        },
        examPoints: [
          "每次 render 建立的物件與函式，都是全新的參照",
          "React.memo 比較 props 參照，收到新參照等於白 memo",
          "useCallback/useMemo 固定參照，讓 memo 真正生效",
        ],
        rubric: [
          {
            criterion: "能解釋 memoization 的觸發點",
            passCondition: "說出 props 參照變化導致子元件 re-render，memo + useCallback 如何配合",
          },
        ],
      },
      {
        slug: "memoization-tradeoffs",
        title: "何時該 memo、何時是過早優化",
        type: "concept",
        topic: "useMemo 與 useCallback",
        dependsOn: ["referential-equality-rerender"],
        intro: {
          hook: "把所有東西都包上 useMemo 不會讓 app 變快——多數時候反而更慢。",
          scenarios: [
            "code review 判斷這個 useMemo 該不該存在",
            "效能調校時先找真正的瓶頸，而不是到處撒 memo",
          ],
          outcome: "能判斷 memoization 的使用時機與成本",
        },
        examPoints: [
          "memo 本身有成本：比較、快取、程式碼複雜度",
          "該用的訊號：計算昂貴，或 memo 子元件需要穩定參照才會生效",
          "不該用：便宜的計算、根本沒有 re-render 問題的地方",
        ],
        rubric: [
          {
            criterion: "能判斷使用時機",
            passCondition: "舉出不需要 useMemo 的例子並說明成本",
          },
        ],
      },
      // ── 實作節點 ──
      {
        slug: "debounce-hook",
        title: "實作：useDebounce",
        type: "practice",
        topic: "useDebounce",
        dependsOn: ["stale-closure-fixes", "extracting-custom-hooks"],
        practiceRuntime: "react-ts",
        practiceBlueprint: {
          objective: "實作可重用的泛型 useDebounce hook，只在值停止變動達指定時間後公開最新值。",
          requirements: [
            "hook 接受任意型別的 value 與 delay，回傳型別必須與 value 一致",
            "value 或 delay 變動時重新計時，間隔內連續變動只採用最後一個值",
            "effect cleanup 會清除尚未執行的 timer",
            "不使用 any，也不以不安全的 type assertion 繞過型別",
          ],
          edgeCases: [
            "delay 為 0 時仍應在 effect 排程後正確更新",
            "元件在 timer 到期前 unmount 不得產生後續更新",
            "對象或陣列值必須保留原本型別與最新參照",
          ],
          starterSignature:
            "export function useDebounce<T>(value: T, delay: number): T",
          timeboxMinutes: 30,
          followUps: [
            "如果需要提供 cancel 與 flush，hook API 會怎麼設計？",
            "debounce 與 throttle 在搜尋、scroll 情境的取捨是什麼？",
          ],
        },
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
        topic: "資料請求",
        dependsOn: ["extracting-custom-hooks", "conditional-rendering-pitfalls"],
        practiceRuntime: "react-ts",
        practiceBlueprint: {
          objective: "實作能完整呈現請求狀態並防止過期回應覆蓋新資料的 React 資料頁。",
          requirements: [
            "明確維護 loading、error 與 data，並對每種狀態呈現可辨識 UI",
            "query 變動時發送新請求，清除上一次錯誤且不顯示舊資料為新結果",
            "使用 AbortController 或等效的 ignore 機制，防止較晚完成的舊請求寫回 state",
            "effect cleanup 會取消或作廢不再需要的請求",
          ],
          edgeCases: [
            "空 query 不發送請求，並回到可預期的初始狀態",
            "請求以與發送順序相反的順序完成時，UI 只顯示最新 query 的結果",
            "AbortError 不得被當成使用者可見的失敗",
          ],
          starterSignature:
            "export default function SearchResults({ query, fetchResults }: SearchResultsProps): JSX.Element",
          timeboxMinutes: 45,
          followUps: [
            "要加入 cache 與 request deduplication 時，你會自己寫還是導入資料請求庫？",
            "如何把多個布林 state 重構成不可能出現矛盾狀態的 union？",
          ],
        },
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

export const reactJuniorMidCurriculum: CurriculumPath = {
  id: "react-junior-mid",
  title: "React Junior → Mid",
  description:
    "建立 React 核心心智模型，掌握 Hooks、資料流與常見實作面試題。",
  subject: "React",
  codeLanguage: "TypeScript",
  status: "published",
  position: 1,
  recommendedPrerequisitePathIds: ["javascript-interview-core"],
  units,
};

// 暫保留舊 export，讓 landing 統計與過渡中的查詢不必同步改寫。
export const curriculum = reactJuniorMidCurriculum.units;
