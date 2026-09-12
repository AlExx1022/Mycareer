import type { CurriculumLesson, CurriculumPath, CurriculumUnit } from "./types";

type Concept = Omit<
  Extract<CurriculumLesson, { type: "concept" }>,
  "type" | "dependsOn" | "intro"
> & {
  hook: string;
  scenarios: string[];
  outcome: string;
};

const concept = ({
  hook,
  scenarios,
  outcome,
  ...value
}: Concept): CurriculumLesson => ({
  ...value,
  type: "concept",
  dependsOn: [],
  intro: { hook, scenarios, outcome },
});

const units: CurriculumUnit[] = [
  {
    slug: "javascript-react-core-values-scope",
    title: "JavaScript：值、宣告與 Scope",
    lessons: [
      concept({
        slug: "jrc-js-data-types",
        title: "資料型別",
        topic: "JavaScript 值與型別",
        hook: "同一個變數可以先放數字再放物件，但每個 runtime value 仍有明確型別。",
        scenarios: ["判斷 primitive 與 object 的差異", "解讀 typeof、Array.isArray 與 BigInt 等型別檢查"],
        outcome: "能列出 JavaScript 型別並以值語意解釋 primitive 與 object。",
        examPoints: [
          "七種 primitive 是 undefined、null、boolean、number、bigint、string、symbol；其餘是 object",
          "primitive 以值比較且不可直接改變；object 具有 identity 並可共享可變內容",
          "typeof 有歷史與分類限制，例如 typeof null 為 object、array 也回 object",
        ],
        rubric: [
          { criterion: "分類 JavaScript 值", passCondition: "能正確列出 primitive，並把 function 與 array 歸入 object 類別。" },
          { criterion: "解釋值與物件語意", passCondition: "能以 identity、可變性與指派行為說明 primitive 和 object 的差異。" },
        ],
      }),
      concept({
        slug: "jrc-js-equality",
        title: "==、=== 與 Object.is",
        topic: "JavaScript 相等比較",
        hook: "NaN 不等於自己、0 卻可能帶正負號；三種相等演算法的差異不只在型別轉換。",
        scenarios: ["面試時逐步推理抽象相等比較", "選擇狀態更新與一般條件判斷所需的比較方式"],
        outcome: "能預測三種比較結果並說明各自適用情境。",
        examPoints: [
          "== 依 Abstract Equality Comparison 進行受規則約束的 coercion，=== 不做跨型別轉換",
          "Object.is 視 NaN 與自身相等，並區分 +0 與 -0；=== 的行為相反",
          "一般程式條件優先使用 ===，需要 SameValue 語意時再使用 Object.is",
        ],
        rubric: [
          { criterion: "推理三種相等演算法", passCondition: "能正確預測至少一個 coercion、NaN 與正負零案例並說明原因。" },
          { criterion: "選擇比較方式", passCondition: "能依需求選擇 ===、Object.is 或刻意使用 ==，而非只背誦永遠不用 ==。" },
        ],
      }),
      concept({
        slug: "jrc-js-null-undefined-undeclared",
        title: "null、undefined 與 undeclared",
        topic: "JavaScript 缺值語意",
        hook: "沒有值、尚未賦值與名稱根本不存在，是三種不同狀態。",
        scenarios: ["設計 API optional 與 nullable 欄位", "診斷 ReferenceError、TDZ 與安全的存在性檢查"],
        outcome: "能區分 null、undefined、undeclared 與 TDZ。",
        examPoints: [
          "undefined 常表示未提供或尚未賦值，null 通常代表呼叫端明確指定沒有值",
          "讀取 undeclared identifier 會拋 ReferenceError，但 typeof undeclared identifier 會回 undefined",
          "TDZ 中的 let／const 雖已在 lexical environment，連 typeof 存取也會拋錯",
        ],
        rubric: [
          { criterion: "區分缺值狀態", passCondition: "能分別說明 null、undefined 與 undeclared 的來源和可觀察行為。" },
          { criterion: "判斷安全存取", passCondition: "能預測直接讀取、typeof 與 TDZ 案例是否回值或拋錯。" },
        ],
      }),
      concept({
        slug: "jrc-js-var-let-const",
        title: "var、let 與 const",
        topic: "JavaScript 變數宣告",
        hook: "const 限制的是 binding 重新指派，不是把物件變成 immutable。",
        scenarios: ["選擇區塊內暫存值的宣告方式", "解讀迴圈 callback 捕捉到的 binding"],
        outcome: "能從 scope、初始化與重新指派解釋三種宣告的差異。",
        examPoints: [
          "var 是 function-scoped 且允許重複宣告；let／const 是 block-scoped",
          "var 宣告提升並初始化為 undefined；let／const 在宣告前位於 TDZ",
          "const 禁止重新指派 binding，但不阻止 object 內部被修改",
        ],
        rubric: [
          { criterion: "比較宣告語意", passCondition: "能從 scope、hoisting、TDZ、重複宣告與重新指派完整比較三者。" },
          { criterion: "解釋 const 限制", passCondition: "能指出 const 保護 binding 而非深層資料，並預測物件 mutation 結果。" },
        ],
      }),
      concept({
        slug: "jrc-js-scope-chain",
        title: "Scope 與 Scope Chain",
        topic: "JavaScript 詞法作用域",
        hook: "函式能讀到哪些名稱，由它寫在哪裡決定，不由它在哪裡被呼叫決定。",
        scenarios: ["追蹤巢狀函式的 identifier resolution", "診斷 shadowing 與意外讀到外層變數"],
        outcome: "能沿 lexical environment 解出名稱並辨認 shadowing。",
        examPoints: [
          "JavaScript 採 lexical scope，函式的外層環境由定義位置決定",
          "identifier resolution 從目前 environment 沿 outer reference 向外搜尋，直到 global scope",
          "內層同名 binding 會 shadow 外層名稱，但不會改變外層 binding 本身",
        ],
        rubric: [
          { criterion: "追蹤 scope chain", passCondition: "能依函式定義位置逐層指出名稱解析到哪個 binding。" },
          { criterion: "辨認 shadowing", passCondition: "能區分內層遮蔽、外層修改與找不到名稱的情況。" },
        ],
      }),
      concept({
        slug: "jrc-js-hoisting-tdz",
        title: "Hoisting 與 TDZ",
        topic: "JavaScript 宣告建立",
        hook: "Hoisting 不是程式碼被搬到頂端，而是執行 context 建立時先建立 binding。",
        scenarios: ["預測宣告前呼叫 function 或讀取變數的結果", "解釋 let／const 為何需要 TDZ"],
        outcome: "能用建立與執行階段解釋 hoisting 與 TDZ。",
        examPoints: [
          "function declaration 在環境建立時完成初始化；var 建立後初始化為 undefined",
          "let、const 與 class binding 已建立但未初始化，宣告執行前位於 TDZ",
          "function expression 的可用時機取決於承接它的 binding，而不是函式語法本身",
        ],
        rubric: [
          { criterion: "解釋 hoisting 模型", passCondition: "能以 binding 建立／初始化說明行為，不以程式碼真的移動作答。" },
          { criterion: "預測宣告前存取", passCondition: "能分辨 function declaration、var、let／const 與 function expression 的結果。" },
        ],
      }),
    ],
  },
  {
    slug: "javascript-react-core-functions-objects",
    title: "JavaScript：函式、物件與集合",
    lessons: [
      concept({
        slug: "jrc-js-closure",
        title: "Closure",
        topic: "JavaScript Closure",
        hook: "函式回傳後還能記住當時的變數，因為它保留的是 lexical environment，不是值的快照。",
        scenarios: ["建立私有狀態或 function factory", "診斷迴圈、timer 與 callback 捕捉變數的問題"],
        outcome: "能以 environment reference 解釋 closure 的建立與後續讀值。",
        examPoints: [
          "函式建立時會捕捉其 lexical environment，離開外層呼叫後仍可存取所需 binding",
          "closure 捕捉的是 binding 而非建立當下的 value snapshot",
          "多個 closure 可能共享同一 binding，也可能各自擁有不同呼叫產生的 environment",
        ],
        rubric: [
          { criterion: "解釋 closure", passCondition: "能說明函式如何保留 lexical environment，且不把 closure 誤解為值複製。" },
          { criterion: "推理共享狀態", passCondition: "能預測多個 closure 共享或隔離 binding 時的輸出。" },
        ],
      }),
      concept({
        slug: "jrc-js-this",
        title: "this",
        topic: "JavaScript this Binding",
        hook: "一般函式的 this 多半由呼叫方式決定，把 method 拿出來呼叫就可能失去 receiver。",
        scenarios: ["判斷 method、callback 與 detached method 的 this", "選擇 call、apply 或 bind 固定呼叫上下文"],
        outcome: "能依呼叫點判定一般函式的 this binding。",
        examPoints: [
          "一般函式的 this 依 new、explicit binding、implicit binding、default binding 優先序決定",
          "obj.method() 的 receiver 是 obj；拆出 method 後呼叫不再保留原 receiver",
          "call／apply 當次指定 this，bind 回傳永久綁定的新函式",
        ],
        rubric: [
          { criterion: "判定 this binding", passCondition: "能依實際 call site 與優先序判斷 this，而非依函式定義位置。" },
          { criterion: "修正 context 遺失", passCondition: "能辨認 detached method 問題並合理選擇 bind、wrapper 或 arrow。" },
        ],
      }),
      concept({
        slug: "jrc-js-arrow-functions",
        title: "Arrow Function",
        topic: "JavaScript 函式形式",
        hook: "Arrow function 不只是短語法；它沒有自己的 this、arguments，也不能搭配 new。",
        scenarios: ["在 callback 與 object method 間選擇函式形式", "解讀 lexical this 與 arguments 的來源"],
        outcome: "能依語意而非篇幅選擇 arrow 或一般函式。",
        examPoints: [
          "arrow 沒有自己的 this，會從外層 lexical environment 取得 this",
          "arrow 沒有自己的 arguments、super 與 new.target，且不可作為 constructor",
          "arrow 適合保留外層 context 的 callback，不適合需要動態 receiver 的 object method",
        ],
        rubric: [
          { criterion: "比較函式形式", passCondition: "能說明 arrow 與一般函式在 this、arguments 與 constructability 的差異。" },
          { criterion: "選擇 arrow 使用時機", passCondition: "能依 callback 或 method 的 receiver 需求做選擇並說明風險。" },
        ],
      }),
      concept({
        slug: "jrc-js-prototype-chain",
        title: "Prototype 與 Prototype Chain",
        topic: "JavaScript Object Model",
        hook: "讀取物件上不存在的屬性時，引擎不是查 class 定義，而是沿著 [[Prototype]] 往上找。",
        scenarios: ["追蹤繼承方法的屬性查找", "區分 constructor.prototype 與 instance 的 [[Prototype]]"],
        outcome: "能畫出 instance、prototype object 與 constructor 的關係。",
        examPoints: [
          "每個一般物件可有內部 [[Prototype]]，屬性查找會沿 chain 直到 null",
          "建構函式的 prototype 屬性通常成為 new instance 的 [[Prototype]]",
          "own property 會 shadow prototype 上的同名屬性；寫入通常建立或更新 own property",
        ],
        rubric: [
          { criterion: "追蹤 prototype chain", passCondition: "能從 instance 沿 [[Prototype]] 找到屬性來源，並以 null 說明鏈的終點。" },
          { criterion: "區分 prototype 名詞", passCondition: "能區分 constructor.prototype、instance [[Prototype]] 與 own property。" },
        ],
      }),
      concept({
        slug: "jrc-js-new-operator",
        title: "new 運算子",
        topic: "JavaScript Object Construction",
        hook: "new 做的不只是一個函式呼叫；它還建立物件、接 prototype、綁 this 並處理回傳值。",
        scenarios: ["手動推演 constructor call", "解釋 constructor 主動回傳 object 或 primitive 的差異"],
        outcome: "能逐步描述 new 的核心演算法。",
        examPoints: [
          "new 建立新物件，並把其 [[Prototype]] 指向 constructor.prototype",
          "constructor 以新物件作為 this 執行",
          "constructor 明確回傳 object 時取代新物件；回傳 primitive 時仍使用新物件",
        ],
        rubric: [
          { criterion: "拆解 new 流程", passCondition: "能依序說明建立物件、連接 prototype、綁定 this、執行與回傳。" },
          { criterion: "推理 constructor 回傳", passCondition: "能預測未回傳、回傳 primitive 與回傳 object 三種結果。" },
        ],
      }),
      concept({
        slug: "jrc-js-array-iteration",
        title: "Array 遍歷方法",
        topic: "JavaScript Array",
        hook: "map、filter、reduce、some 與 forEach 都會走訪陣列，但回傳契約和短路能力完全不同。",
        scenarios: ["依轉換、篩選、查找與副作用需求選 API", "避免 async callback 與 forEach 的常見陷阱"],
        outcome: "能依資料流與控制流選擇合適的陣列方法。",
        examPoints: [
          "map 做一對一轉換、filter 保留符合項目、reduce 累積成單一結果、forEach 側重副作用",
          "find 回傳第一個值；some／every 回傳 boolean 並可短路；forEach 無法以 return 提前結束",
          "forEach 不會等待 async callback，需要依序等待時使用 for...of，需要並行時組合 map 與 Promise.all",
        ],
        rubric: [
          { criterion: "選擇遍歷方法", passCondition: "能依轉換、篩選、查找、判斷、累積或副作用選出合適方法。" },
          { criterion: "解釋 async 遍歷", passCondition: "能指出 forEach 不等待 Promise，並依並行需求提出正確替代方案。" },
        ],
      }),
      concept({
        slug: "jrc-js-shallow-deep-copy",
        title: "淺拷貝與深拷貝",
        topic: "JavaScript Copy Semantics",
        hook: "展開運算子只複製第一層；巢狀物件仍可能和原資料共用同一個 reference。",
        scenarios: ["更新巢狀狀態而不污染原物件", "選擇 structuredClone、序列化或領域特定拷貝"],
        outcome: "能辨認 reference sharing 並選擇合適的複製策略。",
        examPoints: [
          "object spread、Array.from、slice 與 Object.assign 都只建立 shallow copy",
          "deep copy 必須遞迴處理巢狀 reference，並面對 cycle、prototype、function 與特殊型別語意",
          "structuredClone 支援多種內建型別與循環參照，但不複製 function，class instance 的語意也需確認",
        ],
        rubric: [
          { criterion: "辨認淺拷貝共享", passCondition: "能預測修改巢狀資料後原物件是否受影響並指出共享 reference。" },
          { criterion: "選擇深拷貝策略", passCondition: "能依資料型別與語意選擇 structuredClone 或領域特定重建，不盲用 JSON。" },
        ],
      }),
      concept({
        slug: "jrc-js-map-object-set",
        title: "Map、Object 與 Set",
        topic: "JavaScript Collections",
        hook: "三者都能保存資料，但 key 型別、唯一性、迭代與序列化需求會改變正確選擇。",
        scenarios: ["設計查表、去重與 membership check", "在 API payload 與 runtime dictionary 間選資料結構"],
        outcome: "能依 key、唯一性與資料交換需求選擇集合。",
        examPoints: [
          "Object 適合具固定欄位的 record；Map 接受任意 key 並提供明確 size 與迭代 API",
          "Set 保存唯一值，適合去重與 membership；object identity 仍以 reference 判定",
          "Object 與 JSON／結構化資料整合直接；Map、Set 序列化前通常需要明確轉換",
        ],
        rubric: [
          { criterion: "選擇集合型別", passCondition: "能依 record、任意 key、唯一集合或 membership 需求選擇 Object、Map、Set。" },
          { criterion: "說明取捨", passCondition: "能提到 key 語意、迭代、size、序列化或 identity 中至少兩項差異。" },
        ],
      }),
    ],
  },
  {
    slug: "javascript-react-core-async",
    title: "JavaScript：非同步",
    lessons: [
      concept({
        slug: "jrc-js-promise",
        title: "Promise",
        topic: "JavaScript Promise",
        hook: "Promise 不是背景執行緒，而是代表一個未來才 settle 的結果與後續反應鏈。",
        scenarios: ["推理 then／catch／finally chaining", "選擇 Promise.all、allSettled、race 或 any"],
        outcome: "能從 state、reaction 與 composition 解釋 Promise。",
        examPoints: [
          "Promise 只有 pending、fulfilled、rejected，settled 後狀態不可再改",
          "then／catch 會回傳新 Promise；callback 回傳值、throw 或回傳 Promise 會決定新鏈的狀態",
          "Promise combinator 的 fail-fast、收集全部、競速與首個成功語意不同",
        ],
        rubric: [
          { criterion: "推理 Promise chain", passCondition: "能逐步預測 value、throw、catch recovery 與 nested Promise 的傳遞結果。" },
          { criterion: "選擇 Promise composition", passCondition: "能依錯誤策略選擇 all、allSettled、race 或 any 並說明原因。" },
        ],
      }),
      concept({
        slug: "jrc-js-async-await",
        title: "async／await",
        topic: "JavaScript Async Functions",
        hook: "await 只暫停目前 async function，不會阻塞整條 JavaScript 執行緒。",
        scenarios: ["將 Promise chain 改寫為結構化控制流", "避免原本可並行的工作被連續 await 序列化"],
        outcome: "能解釋 async function 的 Promise 語意與並行策略。",
        examPoints: [
          "async function 一定回傳 Promise；return value 會成為 fulfilled value，throw 會成為 rejection",
          "await 會把後續部分排入 microtask，並以 try／catch 接住 awaited rejection",
          "先建立多個 Promise 再 Promise.all／await 可保留並行；逐一 await 會形成序列",
        ],
        rubric: [
          { criterion: "解釋 async／await", passCondition: "能把 return、throw、await 與 Promise fulfillment／rejection 正確對應。" },
          { criterion: "判斷並行與序列", passCondition: "能辨認連續 await 的序列化，並在無依賴工作中正確保留並行。" },
        ],
      }),
      concept({
        slug: "jrc-js-event-loop",
        title: "Event Loop",
        topic: "JavaScript Event Loop",
        hook: "setTimeout(fn, 0) 不會立刻執行；目前 call stack 與 microtask queue 都清空後才輪得到它。",
        scenarios: ["預測同步程式、Promise 與 timer 的輸出順序", "診斷 long task 為何阻塞互動與畫面更新"],
        outcome: "能用 call stack、task 與 microtask 描述執行順序。",
        examPoints: [
          "同步程式先在 call stack 執行；event loop 在 stack 清空後推進後續工作",
          "目前 task 結束後會先排空 microtask queue，再進到下一個 task；Promise reaction 屬 microtask",
          "timer 延遲是最短等待時間而非精準執行時間；長時間同步工作仍會阻塞 event loop",
        ],
        rubric: [
          { criterion: "預測事件循環順序", passCondition: "能正確排列同步輸出、Promise microtask 與 timer task 並說明 queue 規則。" },
          { criterion: "解釋阻塞", passCondition: "能指出 long task 佔住 call stack，timer 到期也不能插隊執行。" },
        ],
      }),
    ],
  },
  {
    slug: "javascript-react-core-react-state-render",
    title: "React：Props、State 與 Render",
    lessons: [
      concept({
        slug: "jrc-react-props-state",
        title: "Props 與 State",
        topic: "React Data Flow",
        hook: "Props 是父層傳入的唯讀快照，State 是元件對跨 render 資料的記憶。",
        scenarios: ["判斷資料應由 props、state 或一般變數承擔", "設計單向資料流與 state ownership"],
        outcome: "能依所有權與生命週期區分 props 與 state。",
        examPoints: [
          "props 由父元件提供且對子元件唯讀；state 由元件持有並透過 setter 安排更新",
          "每次 render 讀到的是該次 props 與 state snapshot，不會在函式執行中途自動改變",
          "共享資料應提升到最近共同父層，由資料向下、事件向上的單向流動維持一致性",
        ],
        rubric: [
          { criterion: "區分 props 與 state", passCondition: "能從所有權、可更新方式與跨 render 保存需求說明差異。" },
          { criterion: "決定 state ownership", passCondition: "能把共享狀態放到合理共同父層，並以 callback 傳遞更新意圖。" },
        ],
      }),
      concept({
        slug: "jrc-react-state-immutability",
        title: "為什麼不能直接修改 State",
        topic: "React State Immutability",
        hook: "直接改物件可能讓資料真的變了，React 卻沒有可辨識的新 snapshot 能安排正確更新。",
        scenarios: ["更新 object 或 array state", "診斷畫面不更新、memo 失效與歷史 snapshot 被污染"],
        outcome: "能從 snapshot 與 reference equality 解釋 immutable update。",
        examPoints: [
          "state 應視為該次 render 的 immutable snapshot，更新要透過 setter 提供下一個值",
          "直接 mutation 保留相同 reference，可能讓 React bail out，也會污染舊 render 所持有的資料",
          "immutable update 只複製被修改路徑；未改變的 branch 可保留 reference 以支援結構共享",
        ],
        rubric: [
          { criterion: "解釋禁止 mutation", passCondition: "能連結 snapshot、reference equality 與 render scheduling，而非只回答 React 規定。" },
          { criterion: "推理巢狀更新", passCondition: "能指出巢狀修改需要複製哪些層，且不做無意義的全資料深拷貝。" },
        ],
      }),
      concept({
        slug: "jrc-react-rerender-conditions",
        title: "React Re-render 條件",
        topic: "React Rendering",
        hook: "父元件重新 render 時，子元件預設也會重新執行，即使傳入內容看起來沒變。",
        scenarios: ["判斷 state、parent render、context 與 external store 更新的影響", "區分 render、DOM commit 與 remount"],
        outcome: "能列出常見 re-render 來源並辨認 render 不等於 DOM 更新。",
        examPoints: [
          "元件自己的 state 更新、父元件 render、所讀 context 更新與訂閱來源通知都可能觸發 render",
          "render 是重新計算 UI；若輸出沒有實質差異，commit 不一定修改 DOM",
          "相同位置且 type 與 key 相同通常保留元件 state；type 或 key 改變會造成 remount",
        ],
        rubric: [
          { criterion: "列出 re-render 來源", passCondition: "能說出 own state、parent、context／subscription 等主要來源，且不把 props 改變當唯一條件。" },
          { criterion: "區分 render 與 remount", passCondition: "能說明 render、commit、state preservation 與 type／key 改變造成 remount 的差異。" },
        ],
      }),
      concept({
        slug: "jrc-react-keys",
        title: "key 的用途",
        topic: "React Reconciliation",
        hook: "key 不是拿來消除 warning；它告訴 React 同一層 sibling 在兩次 render 間誰是誰。",
        scenarios: ["處理插入、刪除與排序的列表", "刻意用 key 重設某個 subtree 的 state"],
        outcome: "能從 identity 與 reconciliation 解釋 key。",
        examPoints: [
          "key 在同一組 sibling 中提供穩定 identity，協助 React 對應前後 element",
          "使用 array index 作 key 在重排、插入或刪除時可能把 state 錯配到另一筆資料",
          "改變 key 會讓 React 視為新 subtree，舊 instance unmount 並重設 state",
        ],
        rubric: [
          { criterion: "解釋 key identity", passCondition: "能說明 key 如何影響 sibling reconciliation 與 state preservation。" },
          { criterion: "選擇穩定 key", passCondition: "能判斷何時 index 安全、何時需要資料中的穩定唯一 id。" },
        ],
      }),
      concept({
        slug: "jrc-react-controlled-components",
        title: "Controlled Component",
        topic: "React Forms",
        hook: "受控 input 的顯示值來自 React state，onChange 只是把使用者意圖送回唯一資料來源。",
        scenarios: ["建立可驗證、可重設的表單", "診斷 controlled／uncontrolled 切換與輸入鎖死"],
        outcome: "能說明 controlled component 的資料流與取捨。",
        examPoints: [
          "controlled form element 由 value／checked prop 決定畫面，onChange 更新對應 state",
          "提供 value 卻不更新 state 會使輸入無法反映使用者變更；不應在生命週期中任意切換 controlled 狀態",
          "uncontrolled element 由 DOM 保存目前值，通常透過 defaultValue 與 ref 讀取，樣板較少但同步控制較弱",
        ],
        rubric: [
          { criterion: "解釋受控資料流", passCondition: "能描述 value／checked、onChange 與 state 之間的完整循環。" },
          { criterion: "比較 controlled 與 uncontrolled", passCondition: "能依即時驗證、外部控制與表單複雜度說明取捨。" },
        ],
      }),
    ],
  },
  {
    slug: "javascript-react-core-react-effects-performance",
    title: "React：Effect、Closure 與效能",
    lessons: [
      concept({
        slug: "jrc-react-use-effect",
        title: "useEffect",
        topic: "React Effects",
        hook: "Effect 的目的不是在 render 後跑任意程式，而是讓 React 狀態與外部系統同步。",
        scenarios: ["同步訂閱、timer、網路連線或第三方 widget", "判斷 derived state 是否根本不需要 effect"],
        outcome: "能辨認 effect boundary 並正確解釋 setup 與 cleanup。",
        examPoints: [
          "render 必須保持純粹；effect 在 commit 後同步 React 以外的系統",
          "effect 可回傳 cleanup，在下次依賴變更後重新 setup 前與 unmount 時執行",
          "可在 render 中由 props／state 推導的資料不應再用 effect 寫回 state",
        ],
        rubric: [
          { criterion: "判斷是否需要 effect", passCondition: "能以外部系統同步作為邊界，排除單純 derived state 與事件處理。" },
          { criterion: "解釋 effect lifecycle", passCondition: "能描述 commit 後 setup、依賴變更時 cleanup→setup、unmount cleanup。" },
        ],
      }),
      concept({
        slug: "jrc-react-dependency-array",
        title: "Dependency Array",
        topic: "React Effect Dependencies",
        hook: "Dependency array 不是你想控制 effect 何時跑的開關，而是 effect 實際讀取哪些 reactive value 的聲明。",
        scenarios: ["修正遺漏依賴造成的舊資料", "穩定不必要變動的 object、function 或訂閱參數"],
        outcome: "能依 effect body 推導完整 dependencies。",
        examPoints: [
          "effect 內讀取的 props、state 與 component scope 變數通常都是 reactive dependencies",
          "React 以 Object.is 比較每個 dependency；每次 render 新建的 object／function 可能讓 effect 重跑",
          "省略 array 代表每次 commit 後執行，空 array 代表不讀取會變動的 reactive value，而非永遠只跑一次的保證",
        ],
        rubric: [
          { criterion: "推導 dependency array", passCondition: "能從 effect 使用的 reactive values 列出依賴，不以手動刪除依賴壓制重跑。" },
          { criterion: "解釋依賴比較", passCondition: "能用 Object.is 與 render 間 identity 說明 object／function dependency 重跑。" },
        ],
      }),
      concept({
        slug: "jrc-react-stale-closure",
        title: "Closure 與 Stale Closure",
        topic: "React Closure",
        hook: "每次 render 都建立新的 closure；舊 callback 看到的是它所屬 render 的 snapshot。",
        scenarios: ["診斷 interval、event listener 與 async callback 讀到舊 state", "選擇 dependency、functional update 或 ref 修復"],
        outcome: "能以 render snapshot 解釋 stale closure 並按需求修正。",
        examPoints: [
          "React function component 每次 render 都有自己的 props、state snapshot 與 closure",
          "長期存活的 callback 若仍引用舊 render binding，就會觀察到 stale value",
          "修法取決於需求：補 dependency 重新訂閱、使用 functional updater、或以 ref 保存不驅動畫面的最新值",
        ],
        rubric: [
          { criterion: "解釋 stale closure", passCondition: "能連結 JavaScript lexical closure 與 React 每次 render 的 snapshot，不歸因於 state 更新太慢。" },
          { criterion: "選擇修正策略", passCondition: "能依重新同步、基於前值更新或讀最新非渲染值的需求選擇 dependency、updater 或 ref。" },
        ],
      }),
      concept({
        slug: "jrc-react-usememo-usecallback",
        title: "useMemo 與 useCallback",
        topic: "React Memoization",
        hook: "useMemo 與 useCallback 是效能最佳化提示，不是讓程式語意正確的保證。",
        scenarios: ["避免昂貴計算或 memoized child 的無效更新", "判斷 memo 成本是否高於重新計算"],
        outcome: "能區分兩個 hook 的快取對象並判斷是否值得使用。",
        examPoints: [
          "useMemo 快取計算結果，useCallback 快取 function identity；useCallback(fn, deps) 可視為針對函式的 memo",
          "dependencies 變更時快取失效；closure 仍遵守該次 render snapshot，缺依賴會造成 stale value",
          "只有昂貴計算、需要穩定 identity 的 memoized child 或其他 dependency 才通常有收益，濫用會增加複雜度與比較成本",
        ],
        rubric: [
          { criterion: "比較 memo hooks", passCondition: "能正確區分 cached value 與 cached function identity，並說明 dependency 失效條件。" },
          { criterion: "評估 memoization", passCondition: "能提出具體效能理由與消費端，且知道 memo 不應用來修正 stale closure。" },
        ],
      }),
    ],
  },
];

export const javascriptReactInterviewCoreCurriculum: CurriculumPath = {
  id: "javascript-react-interview-core",
  title: "JavaScript & React Interview Core",
  description:
    "面試導向的 JavaScript 與 React 核心觀念檢核；所有節點皆可直接開始，不含實作題。",
  subject: "JavaScript 與 React",
  codeLanguage: "JavaScript／React JSX",
  status: "published",
  position: 4,
  recommendedPrerequisitePathIds: [],
  units,
};
