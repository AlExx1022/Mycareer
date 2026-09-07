import type { CurriculumLesson, CurriculumPath, CurriculumUnit } from "./types";

type Concept = Omit<
  Extract<CurriculumLesson, { type: "concept" }>,
  "type"
>;
type Practice = Omit<
  Extract<CurriculumLesson, { type: "practice" }>,
  "type" | "practiceRuntime"
>;

const concept = (value: Concept): CurriculumLesson => ({
  ...value,
  type: "concept",
});

const practice = (value: Practice): CurriculumLesson => ({
  ...value,
  type: "practice",
  practiceRuntime: "vanilla-js",
});

const units: CurriculumUnit[] = [
  {
    slug: "javascript-values-and-comparison",
    title: "值、型別與比較",
    lessons: [
      concept({
        slug: "js-runtime-values-types",
        title: "JavaScript runtime、值與型別",
        topic: "值與型別",
        dependsOn: [],
        intro: {
          hook: "fetch、document、setTimeout 天天都在用，但它們其實不是 JavaScript 語言本身。",
          scenarios: [
            "面試時分清 ECMAScript 語言能力與 Browser／Node host API",
            "讀錯誤訊息時判斷問題來自語言語意、runtime，還是執行環境",
          ],
          outcome: "能描述 JavaScript、runtime 與 host API 的邊界，並區分 primitive 與 object。",
        },
        examPoints: [
          "ECMAScript 定義語言語法與核心物件；瀏覽器與 Node 提供不同 host API",
          "primitive 按值表達，object 透過參照身分共享可變內容",
          "JavaScript 是動態型別：型別屬於 runtime value，不固定在 binding 上",
        ],
        rubric: [
          {
            criterion: "解釋語言與執行環境邊界",
            passCondition: "能指出 fetch 或 document 是 host API，並舉出至少一項 ECMAScript 核心能力。",
          },
          {
            criterion: "推理值與參照",
            passCondition: "能預測 primitive 與 object 指派後修改的差異，理由包含 object identity。",
          },
        ],
      }),
      concept({
        slug: "js-absent-values-type-checks",
        title: "undefined、null 與型別檢查",
        topic: "值與型別",
        dependsOn: ["js-runtime-values-types"],
        intro: {
          hook: "沒有值可能是 undefined、null、屬性不存在，甚至變數根本沒宣告；它們不是同一件事。",
          scenarios: [
            "處理 API 的 optional field 與刻意清空的欄位",
            "選擇 typeof、Array.isArray 或 instanceof，避免錯判資料",
          ],
          outcome: "能辨認不同的缺值狀態，並選擇可靠的 runtime type check。",
        },
        examPoints: [
          "undefined 通常表示尚未提供，null 通常表示呼叫端明確指定沒有值",
          "typeof null 是歷史陷阱；array 應用 Array.isArray，instanceof 依 prototype chain",
          "typeof undeclared identifier 可安全回 undefined，但 TDZ 中的 let／const 仍會拋錯",
        ],
        rubric: [
          {
            criterion: "區分缺值語意",
            passCondition: "能說明 null 與 undefined 在 API contract 中的不同意圖，不只回答兩者都 falsy。",
          },
          {
            criterion: "選擇型別檢查",
            passCondition: "面對 array、object 與 class instance 能選對檢查方式，並指出 typeof null 陷阱。",
          },
        ],
      }),
      concept({
        slug: "js-truthiness-and-defaulting",
        title: "Truthy、Falsy 與預設值",
        topic: "比較與預設",
        dependsOn: ["js-absent-values-type-checks"],
        intro: {
          hook: "把 pageSize 的 0 自動換成 20，可能不是貼心，而是 || 偷吃了合法資料。",
          scenarios: [
            "為設定值提供預設，同時保留 0、false 與空字串",
            "閱讀以 &&、|| 做條件流程的短程式並預測真正回傳值",
          ],
          outcome: "能推理 truthiness、短路求值與 ||／?? 的預設值差異。",
        },
        examPoints: [
          "false、0、-0、0n、空字串、null、undefined、NaN 是常見 falsy 值",
          "&& 與 || 短路後回傳原 operand，不會固定轉成 boolean",
          "?? 只在 null／undefined 時取右值，適合保留其他合法 falsy 值",
        ],
        rubric: [
          {
            criterion: "預測短路表達式",
            passCondition: "能逐步預測含 0、空字串與物件的 &&／|| 結果，並指出回傳的是 operand。",
          },
          {
            criterion: "選擇預設策略",
            passCondition: "能根據 0／false 是否為合法值選擇 || 或 ??，並說明 trade-off。",
          },
        ],
      }),
      concept({
        slug: "js-coercion-and-equality",
        title: "Coercion 與相等比較",
        topic: "比較與預設",
        dependsOn: ["js-truthiness-and-defaulting"],
        intro: {
          hook: "[] == false 為 true，[] === false 卻為 false；背答案沒用，面試官會立刻換一組值。",
          scenarios: [
            "不執行程式就推理字串、數字與物件參與運算的結果",
            "選擇 ===、Object.is 或明確轉型來表達真正意圖",
          ],
          outcome: "能以轉型步驟解釋相等與運算結果，不靠死背題庫。",
        },
        examPoints: [
          "+ 同時可能做數字加法或字串串接；其他算術運算通常先轉 Number",
          "=== 不做型別轉換；== 依規則轉型，應能解釋而非一律宣稱不能用",
          "NaN 不等於自身；Object.is 可區分 +0／-0 並判定 NaN 與自身相同",
        ],
        rubric: [
          {
            criterion: "推理 coercion 過程",
            passCondition: "能對至少兩個混合型別表達式列出轉型順序與結果，不只背最終輸出。",
          },
          {
            criterion: "選擇相等判斷",
            passCondition: "能比較 ===、==、Object.is 的邊界，並為實際資料 contract 選擇適合做法。",
          },
        ],
      }),
      concept({
        slug: "js-identity-mutation-copy",
        title: "參照身分、Mutation 與 Shallow Copy",
        topic: "參照與複製",
        dependsOn: ["js-coercion-and-equality"],
        intro: {
          hook: "你明明展開複製了一份設定，改 nested 欄位時原設定卻一起變了。",
          scenarios: [
            "避免函式偷偷修改呼叫端傳入的 object 或 array",
            "判斷 spread、structuredClone 與領域專用 mapping 各自適合的深度",
          ],
          outcome: "能畫出 alias 關係，預測 mutation 傳播，並選擇合理的 copy 策略。",
        },
        examPoints: [
          "binding 保存 object reference；兩個 binding 可指向同一個 object identity",
          "object／array spread 只建立第一層新容器，nested object 仍共享參照",
          "structuredClone 可處理多種深層資料，但 function／DOM 等有邊界；常應依 domain 明確重建",
        ],
        rubric: [
          {
            criterion: "推理 alias 與 mutation",
            passCondition: "能預測多個參照指向同一物件時的修改結果，並畫清楚哪一層共享。",
          },
          {
            criterion: "選擇複製策略",
            passCondition: "能指出 shallow copy 未隔離 nested value，並依資料型態提出最小安全修正。",
          },
        ],
      }),
      practice({
        slug: "js-output-reasoning-lab",
        title: "實作：值與比較輸出推理",
        topic: "Interview Lab",
        dependsOn: ["js-identity-mutation-copy"],
        examPoints: [
          "先預測 coercion、短路與 identity 題組輸出，再用程式驗證",
          "把每個預測對應到具體規則，而非只提交答案",
        ],
        rubric: [
          {
            criterion: "輸出預測完整",
            passCondition: "所有指定案例回傳預期值，包含 NaN、nullish、shallow copy 與 identity 邊界。",
          },
          {
            criterion: "推理可追溯",
            passCondition: "程式命名或註解能將每組結果連回 coercion、短路或參照規則，沒有以 eval 繞過推理。",
          },
        ],
        practiceBlueprint: {
          objective: "完成一組可測試的 JavaScript 輸出預測矩陣，並為每項結果標記使用的語意規則。",
          requirements: [
            "實作 predictOutputs，依固定 label 回傳每個 expression 的預測結果",
            "案例必須涵蓋 ||／??、===／Object.is、NaN、字串與數字 coercion",
            "至少一組案例驗證 object alias 與 shallow copy 的差異",
            "不得使用 eval、Function constructor 或執行題目字串取得答案",
          ],
          edgeCases: [
            "保留 0、false 與空字串，不得在序列化時誤當缺值",
            "NaN 需以可測試方式表達，不依賴 JSON 將 NaN 轉成 null",
            "nested object 經 shallow copy 後仍共享參照",
          ],
          starterSignature:
            "export function predictOutputs(): Array<{ label: string; value: unknown; rule: string }>",
          timeboxMinutes: 25,
          followUps: [
            "若資料來自 query string，你會在哪一層做明確轉型與 validation？",
            "Object.is 最適合解決哪些 === 無法表達的比較？",
          ],
        },
      }),
    ],
  },
  {
    slug: "javascript-scope-functions-this",
    title: "Scope、Function 與 this",
    lessons: [
      concept({
        slug: "js-variable-scopes",
        title: "var、let、const 與作用域",
        topic: "Scope",
        dependsOn: ["js-output-reasoning-lab"],
        intro: {
          hook: "一個 if 區塊外讀得到 var，卻讀不到 let；問題不只是『新舊語法』。",
          scenarios: [
            "定位 shadowing、意外 global 與 loop callback 讀錯值",
            "在 script 與 ES module 中判斷 top-level binding 的可見範圍",
          ],
          outcome: "能沿 lexical environment 判斷 binding 可見性，並合理選擇 const、let、var。",
        },
        examPoints: [
          "scope 包含 global、module、function 與 block；lookup 從目前 lexical scope 向外找",
          "var 是 function-scoped；let／const 是 block-scoped，const 限制重新賦值而非凍結物件",
          "shadowing 建立新 binding；ES module top-level 不等於 global object property",
        ],
        rubric: [
          {
            criterion: "推理作用域 lookup",
            passCondition: "能逐行指出含 block、function 與 shadowing 程式的每個 identifier 解析到哪個 binding。",
          },
          {
            criterion: "選擇宣告方式",
            passCondition: "能以重新賦值與 scope 需求選 const／let，並具體說明 var 帶來的風險。",
          },
        ],
      }),
      concept({
        slug: "js-hoisting-and-tdz",
        title: "Hoisting 與 Temporal Dead Zone",
        topic: "Scope",
        dependsOn: ["js-variable-scopes"],
        intro: {
          hook: "宣告前呼叫 function 能成功，讀 var 得 undefined，讀 let 卻直接 ReferenceError。",
          scenarios: [
            "預測宣告前存取的結果，不再用『整段程式被搬到上面』誤導自己",
            "找出 module cyclic dependency 或 shadowing 造成的初始化錯誤",
          ],
          outcome: "能用建立 binding 與初始化時機解釋 hoisting、undefined 與 TDZ。",
        },
        examPoints: [
          "進入 scope 時 binding 會先建立，但不同 declaration 的初始化時機不同",
          "function declaration 可在宣告前呼叫；var 初始化為 undefined；let／const 初始化前位於 TDZ",
          "TDZ 從 scope 開始到 declaration 執行，不等於 let／const 沒有 hoist",
        ],
        rubric: [
          {
            criterion: "解釋初始化模型",
            passCondition: "能以 binding creation／initialization 解釋 function、var、let 的三種結果，不說程式碼真的被搬動。",
          },
          {
            criterion: "定位 TDZ root cause",
            passCondition: "能在 shadowing 範例指出內層 binding 造成 TDZ，而不是誤讀成外層值。",
          },
        ],
      }),
      concept({
        slug: "js-function-forms-and-callbacks",
        title: "函式形式、First-class Function 與 Callback",
        topic: "Function",
        dependsOn: ["js-hoisting-and-tdz"],
        intro: {
          hook: "callback 只是被傳入的函式，不會因為叫 callback 就自動變成非同步。",
          scenarios: [
            "在 array iterator、event handler 與 Promise API 中判斷 callback 何時執行",
            "依 hoisting、this 與可讀性選 function declaration、expression 或 arrow",
          ],
          outcome: "能解釋 function 是 first-class value，並區分 callback 與 async scheduling。",
        },
        examPoints: [
          "函式可被指派、傳入、回傳；callback 描述角色，不保證同步或非同步",
          "declaration 與 expression 的初始化行為不同；arrow 沒有自己的 this／arguments／prototype",
          "高階函式接收或回傳函式，可用來封裝策略而非只縮短語法",
        ],
        rubric: [
          {
            criterion: "區分函式角色與排程",
            passCondition: "能舉同步與非同步 callback 各一例，並說明執行時機由呼叫端 API 決定。",
          },
          {
            criterion: "選擇函式形式",
            passCondition: "面對需要 this、hoisting 或 lexical callback 的情境能選擇形式並說明理由。",
          },
        ],
      }),
      concept({
        slug: "js-lexical-scope-and-closure",
        title: "Lexical Scope 與 Closure",
        topic: "Closure",
        dependsOn: ["js-function-forms-and-callbacks"],
        intro: {
          hook: "外層函式早已 return，裡面的 counter 為什麼還記得 count？",
          scenarios: [
            "用 factory 建立彼此獨立的私有狀態",
            "診斷 loop handler、timer 與 stale data 捕捉錯誤",
          ],
          outcome: "能從函式定義位置推理捕捉的 lexical environment 與生命週期。",
        },
        examPoints: [
          "closure 是函式與其定義時 lexical environment 的組合，不由呼叫位置決定",
          "被內層函式引用的 binding 可在外層 return 後繼續存活，每次 factory 呼叫建立獨立環境",
          "closure 捕捉 binding 而非凍結值；var loop 共享 binding，let 每輪建立新 binding",
        ],
        rubric: [
          {
            criterion: "解釋 closure 環境",
            passCondition: "能畫出 factory 產生兩個函式時各自捕捉的 binding，並預測連續呼叫結果。",
          },
          {
            criterion: "修復 loop closure",
            passCondition: "能指出 var callback 共用同一 binding，並以 let 或額外 factory 提供最小修正。",
          },
        ],
      }),
      concept({
        slug: "js-this-and-binding",
        title: "this、Arrow 與 bind",
        topic: "Function",
        dependsOn: ["js-lexical-scope-and-closure"],
        intro: {
          hook: "obj.run() 正常，把 obj.run 傳給 setTimeout 後 this 卻不見了；關鍵在 call site。",
          scenarios: [
            "修復 method 當 callback 後遺失 context",
            "判斷 arrow、method、call／apply／bind 在 API adapter 中的正確用法",
          ],
          outcome: "能從呼叫形式判定一般函式的 this，並知道 arrow 使用外層 lexical this。",
        },
        examPoints: [
          "一般函式的 this 由 call site 決定：method、explicit binding、constructor 與 plain call",
          "取出 method 再呼叫會失去 receiver；call／apply 立即呼叫，bind 回傳綁定後的新函式",
          "arrow 沒有自己的 this，適合保留外層 context，但不適合作為需要動態 receiver 的 method",
        ],
        rubric: [
          {
            criterion: "由 call site 推理 this",
            passCondition: "能預測同一函式以 method、detached function、call 與 bind 呼叫時的 receiver。",
          },
          {
            criterion: "修復 context loss",
            passCondition: "能以 bind、wrapper 或 API 設計修正遺失 this，並說明為何不是 closure 值複製問題。",
          },
        ],
      }),
      practice({
        slug: "js-closure-this-debug-lab",
        title: "實作：Closure 與 this Debug",
        topic: "Interview Lab",
        dependsOn: ["js-this-and-binding"],
        examPoints: [
          "修復 loop handler late binding 與 detached method context loss",
          "以 closure 建立不可由外部直接竄改的私有狀態",
        ],
        rubric: [
          {
            criterion: "三類 bug 均從 root cause 修復",
            passCondition: "測試涵蓋獨立私有狀態、每輪 handler 值與 detached callback receiver，且不得 hard-code 輸出。",
          },
          {
            criterion: "修正保持最小且可解釋",
            passCondition: "能分別以 lexical binding、call site 與 closure 說明三種修正，不混為同一類問題。",
          },
        ],
        practiceBlueprint: {
          objective: "修復一組 closure 與 this 常見面試 bug，並保留既有公開 API contract。",
          requirements: [
            "實作 createCounter，使每次 factory 呼叫都有獨立且不可直接寫入的 count",
            "建立 loop handlers，使每個 handler 回傳建立當輪的項目而非最後一項",
            "修復物件 method 作為 callback 傳遞時的 context loss",
            "不得以 global variable 或 hard-coded index 規避 lexical binding 問題",
          ],
          edgeCases: [
            "兩個 counter 交錯呼叫仍互不影響",
            "空 items 應回傳空 handlers",
            "callback 延後執行後仍使用正確 receiver 與當輪資料",
          ],
          starterSignature:
            "export function createCounter(initial = 0): { increment(): number; value(): number }",
          timeboxMinutes: 30,
          followUps: [
            "class private field 與 closure private state 的記憶體、測試與介面取捨是什麼？",
            "若 callback 需要可取消，你會如何擴充回傳 contract？",
          ],
        },
      }),
    ],
  },
  {
    slug: "javascript-data-and-object-model",
    title: "資料處理與 Object Model",
    lessons: [
      concept({
        slug: "js-array-method-contracts",
        title: "Array 迭代方法的契約",
        topic: "Collections",
        dependsOn: ["js-closure-this-debug-lab"],
        intro: {
          hook: "能用 reduce 寫完不代表該用 reduce；面試更在意你是否看懂輸出 contract。",
          scenarios: [
            "根據一對一轉換、篩選、單筆查找或布林判斷選擇 array method",
            "code review 拆解難讀的萬用 reduce，避免 callback 副作用",
          ],
          outcome: "能從輸出形狀與提前終止需求選擇 map、filter、find、some、every 或 reduce。",
        },
        examPoints: [
          "map 保持長度做一對一轉換；filter 產生子集合；find 找第一筆值",
          "some／every 回傳 boolean 且可提前終止；forEach 不回收結果，也不能一般 break",
          "reduce 適合真正累積單一結果，但 accumulator contract 必須清楚並提供 initial value",
        ],
        rubric: [
          {
            criterion: "依需求選擇 API",
            passCondition: "能為轉換、查找、存在性與聚合案例選擇最直接方法，並說出輸出 contract。",
          },
          {
            criterion: "辨識 iterator 誤用",
            passCondition: "能指出 map 只為副作用、filter 後再找一筆或無 initial reduce 的問題並最小改寫。",
          },
        ],
      }),
      concept({
        slug: "js-mutating-array-apis",
        title: "Mutating 與 Non-mutating Array API",
        topic: "Collections",
        dependsOn: ["js-array-method-contracts"],
        intro: {
          hook: "在 helper 裡呼叫 items.sort()，呼叫端的原陣列也被永久重排了。",
          scenarios: [
            "建立 selector 或資料轉換 helper，不污染 cache、props 或 state",
            "在 sort／splice 與 toSorted／toSpliced 或 copy-first 寫法間選擇",
          ],
          outcome: "能辨認常見 mutating API，維護 input immutability，並避免 comparator 錯誤。",
        },
        examPoints: [
          "sort、reverse、splice、push 等會修改原陣列；slice、map、filter 會建立新陣列",
          "toSorted／toReversed／toSpliced 提供 immutable 對應；舊環境可先 spread 再操作",
          "預設 sort 以字串比較；數字與領域排序需提供穩定、符合 contract 的 comparator",
        ],
        rubric: [
          {
            criterion: "辨認 mutation 邊界",
            passCondition: "能預測 sort／splice 對 alias 的影響，並提出不改 input 的實作。",
          },
          {
            criterion: "實作正確排序",
            passCondition: "能為 number 或 object key 寫 comparator，且不以 boolean 當 comparator 回傳值。",
          },
        ],
      }),
      concept({
        slug: "js-map-set-data-selection",
        title: "Object、Map 與 Set 怎麼選",
        topic: "Collections",
        dependsOn: ["js-mutating-array-apis"],
        intro: {
          hook: "拿 array.includes 做上萬次 membership lookup，語意和複雜度都可能選錯。",
          scenarios: [
            "依 key 類型、唯一性與迭代需求選 Object、Map、Set 或 Array",
            "實作去重、frequency map 與 entity lookup，並說明 Big-O",
          ],
          outcome: "能以資料 contract 與操作模式選擇集合，避免把所有東西塞進 plain object。",
        },
        examPoints: [
          "Object 適合固定字串欄位 record；Map 支援任意 key、明確 size 與集合操作語意",
          "Set 表達唯一值與 membership；去重後若要保留物件 identity，需理解 equality 採 SameValueZero",
          "Map／Set 平均 lookup 常視為 O(1)，Array find／includes 為 O(n)，但資料量與可讀性仍要衡量",
        ],
        rubric: [
          {
            criterion: "依 contract 選資料結構",
            passCondition: "面對 frequency、unique membership、固定 record 與 object-key lookup 能選擇結構並說明理由。",
          },
          {
            criterion: "推理 equality 與複雜度",
            passCondition: "能說明 Set 對 object 以 identity 去重，並比較 Array lookup 與 Map／Set lookup 成本。",
          },
        ],
      }),
      concept({
        slug: "js-prototype-chain-and-class",
        title: "Prototype Chain、new 與 Class",
        topic: "Object Model",
        dependsOn: ["js-map-set-data-selection"],
        intro: {
          hook: "class 語法看起來像傳統 OOP，但 JavaScript 尋找 method 時仍走 prototype chain。",
          scenarios: [
            "解釋 instance 為何能呼叫自身沒有的 method",
            "診斷 shared prototype state、錯誤 new 使用與 instanceof 判斷",
          ],
          outcome: "能解釋 property lookup、new 的核心步驟，以及 class 與 prototype model 的關係。",
        },
        examPoints: [
          "property lookup 先查 own property，再沿 [[Prototype]] chain 向上直到 null",
          "new 建立並連結物件、以該物件呼叫 constructor，最後依明確 return 規則決定結果",
          "class 是 prototype model 的語法層；instance method 通常共享在 prototype，不應把 mutable data 放在 prototype",
        ],
        rubric: [
          {
            criterion: "推理 property lookup",
            passCondition: "能指出 own、prototype 與 shadowing property 的查找順序及修改落點。",
          },
          {
            criterion: "解釋 new／class 邊界",
            passCondition: "能描述 new 的主要步驟，並說明 class method 為何由 instances 共享。",
          },
        ],
      }),
      practice({
        slug: "js-data-transform-lab",
        title: "實作：資料正規化與 groupBy",
        topic: "Interview Lab",
        dependsOn: ["js-prototype-chain-and-class"],
        examPoints: [
          "以 Map／Set 與 array methods 完成去重、分組與排序",
          "保持 input immutability 並口述時間、空間複雜度",
        ],
        rubric: [
          {
            criterion: "資料轉換 contract 完整",
            passCondition: "正規化、去重、分組、排序與空值策略均通過測試，輸出順序穩定。",
          },
          {
            criterion: "無副作用且複雜度合理",
            passCondition: "不得修改 input 或 nested source，並能說明主要流程的 O(n)／O(n log n) 成本。",
          },
        ],
        practiceBlueprint: {
          objective: "將含重複與缺漏欄位的 API records 正規化、依 category 分組並產生穩定排序結果。",
          requirements: [
            "以 id 去重，重複資料依明確策略保留最後一筆有效 record",
            "忽略無有效 id 的資料，將缺少 category 的項目歸入 uncategorized",
            "每組依 score 降冪、id 升冪做穩定 tie-break，回傳一般可序列化物件",
            "不得修改 input array 或其中任何原始 record",
          ],
          edgeCases: [
            "空 input 回傳空結果",
            "score 為 0 必須保留，不得被 || 預設吃掉",
            "重複 id、相同 score、缺少 category 與無效 id 可同時出現",
          ],
          starterSignature:
            "export function normalizeAndGroup(records): Record<string, Array<{ id: string; score: number }>>",
          timeboxMinutes: 35,
          followUps: [
            "若資料量無法一次放入記憶體，你會如何改成 streaming aggregation？",
            "若要保留原始輸入順序而非 score 排序，資料結構與複雜度會怎麼變？",
          ],
        },
      }),
    ],
  },
  {
    slug: "javascript-async",
    title: "非同步 JavaScript",
    lessons: [
      concept({
        slug: "js-event-loop-tasks-microtasks",
        title: "Call Stack、Event Loop、Task 與 Microtask",
        topic: "Event Loop",
        dependsOn: ["js-data-transform-lab"],
        intro: {
          hook: "setTimeout(..., 0) 不會立刻跑，而 Promise.then 往往比它更早；答案藏在 queue。",
          scenarios: [
            "預測同步 log、Promise callback 與 timer 混合程式的輸出",
            "解釋長任務為何卡住點擊與畫面更新",
          ],
          outcome: "能以 run-to-completion、task 與 microtask queue 推理執行順序。",
        },
        examPoints: [
          "目前 call stack 會 run-to-completion；event loop 在 stack 清空後取下一項工作",
          "Promise reaction 排入 microtask；timer callback 排入 task，通常先清空 microtasks 再進下一 task",
          "排程順序不等於精確時間保證；長同步工作會阻塞 main thread 與 rendering opportunity",
        ],
        rubric: [
          {
            criterion: "預測 event loop 輸出",
            passCondition: "能逐步列出同步、兩層 microtask 與 timer 的順序，理由包含 queue 與 stack。",
          },
          {
            criterion: "診斷 main-thread blocking",
            passCondition: "能指出長同步迴圈會延後事件與 render，並提出切片或 worker 等方向。",
          },
        ],
      }),
      concept({
        slug: "js-promise-chaining",
        title: "Promise 狀態與 Chaining",
        topic: "Promise",
        dependsOn: ["js-event-loop-tasks-microtasks"],
        intro: {
          hook: "then 裡忘了 return，下一個 then 不是等不到，而是立刻收到 undefined。",
          scenarios: [
            "串接依賴前一步結果的非同步流程",
            "診斷 nested Promise、漏 return 與以為 Promise value 會同步出現的錯誤",
          ],
          outcome: "能追蹤每一段 then 產生的新 Promise、值採納與錯誤傳遞。",
        },
        examPoints: [
          "Promise 由 pending settle 為 fulfilled 或 rejected，settled 後狀態不可再改",
          "then 每次都回傳新的 Promise；callback 回傳普通值、Promise 或 throw 會決定下游狀態",
          "漏 return 使下游收到 undefined；return Promise 才會讓 chain 等待其結果",
        ],
        rubric: [
          {
            criterion: "追蹤 Promise chain",
            passCondition: "能標出每個 then 所回傳 Promise 的狀態和值，包含回傳 nested Promise 與 throw。",
          },
          {
            criterion: "修復漏 return",
            passCondition: "能找到 chain 提前執行的 root cause 並加入正確 return，而非再包無意義 Promise。",
          },
        ],
      }),
      concept({
        slug: "js-promise-error-flow",
        title: "Promise 錯誤傳遞",
        topic: "Promise",
        dependsOn: ["js-promise-chaining"],
        intro: {
          hook: "catch 裡 log 完不再 throw，對下游來說錯誤已被『成功處理』，流程會繼續 fulfilled。",
          scenarios: [
            "設計 fallback、rethrow 與 finally cleanup，不吞掉真正失敗",
            "處理 unhandled rejection 並保留原始 error context",
          ],
          outcome: "能預測 rejection 如何沿 chain 傳播，並明確決定 recover 或 rethrow。",
        },
        examPoints: [
          "throw 或 rejected Promise 會跳到下一個 rejection handler；catch 本身也回傳新 Promise",
          "catch 回傳值代表 recovery，下游恢復 fulfilled；要保留失敗必須 rethrow 或回傳 rejection",
          "finally 不接收 settled value，適合 cleanup；除非 finally 自己失敗，否則保留原狀態",
        ],
        rubric: [
          {
            criterion: "推理錯誤流",
            passCondition: "能預測 catch recover、catch rethrow 與 finally throw 三種 chain 的最終狀態。",
          },
          {
            criterion: "設計錯誤策略",
            passCondition: "能區分可恢復錯誤與必須往上傳的錯誤，並避免只 log 後無意吞錯。",
          },
        ],
      }),
      concept({
        slug: "js-async-await-concurrency",
        title: "async/await 與並行等待",
        topic: "Async/Await",
        dependsOn: ["js-promise-error-flow"],
        intro: {
          hook: "把兩個獨立請求連續 await，程式更好讀了，總時間卻平白變成兩倍。",
          scenarios: [
            "區分有依賴的 sequential flow 與可同時啟動的 concurrency",
            "使用 Promise.all 或 allSettled 表達 fail-fast 與 partial result 策略",
          ],
          outcome: "能把 async/await 還原成 Promise 心智模型，並依資料依賴安排並行。",
        },
        examPoints: [
          "async function 永遠回傳 Promise；await 暫停該 async function，不會阻塞整條 thread",
          "先各自啟動 Promise 再一起 await 可並行；迴圈內逐次 await 通常是 sequential",
          "Promise.all 採 fail-fast；allSettled 保留每項結果，策略應由產品 contract 決定",
        ],
        rubric: [
          {
            criterion: "辨認 sequential 與 concurrent",
            passCondition: "能根據資料依賴改寫兩個請求並估算總等待時間差異。",
          },
          {
            criterion: "選擇 Promise composition",
            passCondition: "能依全有或全無、部分結果需求選 all 或 allSettled，並說明錯誤 contract。",
          },
        ],
      }),
      concept({
        slug: "js-async-race-and-cancellation",
        title: "非同步 Race 與 Cancellation",
        topic: "Async/Await",
        dependsOn: ["js-async-await-concurrency"],
        intro: {
          hook: "搜尋 abc 的回應先回來，稍早的 a 最後才回來，畫面就被舊資料蓋掉。",
          scenarios: [
            "實作 latest-request-wins，防止舊 response 覆蓋新查詢",
            "用 AbortController 取消 fetch，並正確區分取消與真正錯誤",
          ],
          outcome: "能辨識完成順序與發出順序不同造成的 race，並選擇 ignore 或 cancellation。",
        },
        examPoints: [
          "async completion order 不保證等於 request order；共享 state 寫入必須驗 request identity",
          "sequence token／current request id 可忽略舊結果，但不會停止底層工作",
          "AbortController 可傳 signal 取消支援的 API；AbortError 應與網路或應用錯誤分流",
        ],
        rubric: [
          {
            criterion: "重現並解釋 race",
            passCondition: "能用兩個延遲相反的請求說明舊結果覆蓋新結果的確切時序。",
          },
          {
            criterion: "實作 latest-request-wins",
            passCondition: "能以 request id 或 AbortController 阻止 stale commit，且不把使用者取消顯示為錯誤。",
          },
        ],
      }),
      practice({
        slug: "js-promise-concurrency-lab",
        title: "實作：批次請求與錯誤策略",
        topic: "Interview Lab",
        dependsOn: ["js-async-race-and-cancellation"],
        examPoints: [
          "實作 sequential、fail-fast concurrency 與 partial-result 三種策略",
          "比較執行時間、錯誤 contract、輸出順序與 concurrency limit",
        ],
        rubric: [
          {
            criterion: "三種策略語意正確",
            passCondition: "測試可觀察 sequential 最大 concurrency 為 1、fail-fast rejection 與 partial-result 保留個別狀態。",
          },
          {
            criterion: "結果順序與錯誤資訊穩定",
            passCondition: "完成順序不同時輸出仍對應 input，錯誤保留 item identity，沒有未處理 rejection。",
          },
        ],
        practiceBlueprint: {
          objective: "為可注入的 async worker 實作 sequential、fail-fast concurrent 與 partial-result 批次處理器。",
          requirements: [
            "runSequential 必須逐項完成後才啟動下一項並保持 input order",
            "runFailFast 必須同時啟動工作並在任一失敗時 reject",
            "runPartial 必須等待全部 settle，回傳每項 success／error 與原始 item id",
            "不得在 helper 內 hard-code fetch；以注入 worker 讓時間與錯誤可測試",
          ],
          edgeCases: [
            "空 input 三種策略都立即回傳空結果",
            "完成順序與 input 順序相反時輸出仍可正確對應",
            "多項同時失敗時不得產生 unhandled rejection",
          ],
          starterSignature:
            "export async function runPartial(items, worker): Promise<Array<{ id: string; status: 'fulfilled' | 'rejected'; value?: unknown; reason?: unknown }>>",
          timeboxMinutes: 35,
          followUps: [
            "如何加入最多同時三個工作的 concurrency limit？",
            "若上游傳入 AbortSignal，三個策略各應如何停止與回報？",
          ],
        },
      }),
    ],
  },
  {
    slug: "javascript-browser-integration",
    title: "Browser Integration",
    lessons: [
      concept({
        slug: "js-es-modules",
        title: "ES Modules",
        topic: "Modules",
        dependsOn: ["js-promise-concurrency-lab"],
        intro: {
          hook: "import 看似只是搬值，實際上 module 有自己的 scope，export 還可能是 live binding。",
          scenarios: [
            "設計 named／default export 並避免 circular dependency 初始化問題",
            "理解瀏覽器 module script 的 strict mode、載入與執行邊界",
          ],
          outcome: "能解釋 ESM 的靜態結構、module scope 與 live binding，不把 import 當物件複製。",
        },
        examPoints: [
          "import／export 是靜態語法，讓工具建立 dependency graph；dynamic import 才是 runtime Promise boundary",
          "每個 module 有獨立 scope 且自動 strict；named 與 default export 的介面取捨不同",
          "import 是 read-only live binding，來源更新可被觀察；circular dependency 可能遇到尚未初始化 binding",
        ],
        rubric: [
          {
            criterion: "解釋 module contract",
            passCondition: "能比較 named／default export、module scope 與 dynamic import 的用途。",
          },
          {
            criterion: "推理 live binding",
            passCondition: "能預測 exporter 更新 binding 後 importer 讀到的值，並指出 importer 不能重新賦值。",
          },
        ],
      }),
      concept({
        slug: "js-error-boundaries-debugging",
        title: "Error Boundary 與 Debugging",
        topic: "Debugging",
        dependsOn: ["js-es-modules"],
        intro: {
          hook: "try/catch 包住 setTimeout 卻抓不到 callback 裡的 throw，因為錯誤早已跨過同步邊界。",
          scenarios: [
            "由 stack trace 與 breakpoint 找到第一個屬於應用程式的 frame",
            "分辨同步 throw、Promise rejection、HTTP error 與錯誤顯示責任",
          ],
          outcome: "能辨識錯誤能被哪一層捕捉，並用 DevTools 縮小 root cause。",
        },
        examPoints: [
          "同步 try/catch 只涵蓋當前 call stack；async callback 與 Promise 必須在其 async boundary 處理",
          "先讀 error message 與 stack 第一個 application frame，再用 breakpoint／scope 檢查假設",
          "Network panel 區分 request、response、status、payload 與 CORS；console log 不是完整 debugging strategy",
        ],
        rubric: [
          {
            criterion: "判斷錯誤邊界",
            passCondition: "能解釋外層 try/catch 為何抓不到 timer 或未 await Promise 的錯誤，並移到正確處理位置。",
          },
          {
            criterion: "提出可重現 debug 流程",
            passCondition: "能依 stack、breakpoint 與 Network evidence 排查，不以隨機改 code 或只加 log 作答。",
          },
        ],
      }),
      concept({
        slug: "js-dom-events-delegation",
        title: "DOM、Event Propagation 與 Delegation",
        topic: "DOM Events",
        dependsOn: ["js-error-boundaries-debugging"],
        intro: {
          hook: "點在按鈕內的 icon 時 event.target 是 svg，真正掛 listener 的卻是整張 list。",
          scenarios: [
            "以 event delegation 處理動態新增的大量列表項目",
            "處理表單 submit、capture／bubble 與 preventDefault，不誤用 stopPropagation",
          ],
          outcome: "能沿 DOM propagation path 推理 target／currentTarget，並安全實作 delegation。",
        },
        examPoints: [
          "事件依 capture → target → bubble 傳播；target 是來源，currentTarget 是目前 listener 所在元素",
          "delegation 在共同祖先監聽，搭配 closest 與 containment check 處理動態 descendants",
          "preventDefault 阻止瀏覽器預設行為；stopPropagation 改變傳播，兩者責任不同",
        ],
        rubric: [
          {
            criterion: "推理 event propagation",
            passCondition: "能在 nested DOM 範例列出 listener 順序，並正確區分 target 與 currentTarget。",
          },
          {
            criterion: "實作安全 delegation",
            passCondition: "能用 closest 找互動項目、排除容器外節點，並只在需要時阻止預設行為。",
          },
        ],
      }),
      concept({
        slug: "js-fetch-http-cors",
        title: "Fetch、HTTP Error 與 CORS",
        topic: "Network",
        dependsOn: ["js-dom-events-delegation"],
        intro: {
          hook: "fetch 收到 404 通常仍是 fulfilled；真正 reject 的多半是網路層失敗或取消。",
          scenarios: [
            "設計 fetch wrapper，分流 network、HTTP、parse 與 domain error",
            "面對 CORS 錯誤時判斷該改 server response、request，還是部署拓撲",
          ],
          outcome: "能完整處理 Response.ok、JSON boundary、取消與 CORS 責任，不只寫 await res.json()。",
        },
        examPoints: [
          "fetch 對 HTTP 4xx／5xx 通常 fulfilled；必須檢查 ok／status，再決定是否 parse body",
          "network failure、AbortError、JSON parse 與 domain validation 是不同 error boundary",
          "CORS 是瀏覽器依 server response headers 執行的跨來源政策，不能由前端任意關閉",
        ],
        rubric: [
          {
            criterion: "設計 fetch error flow",
            passCondition: "能處理 404 JSON、500 非 JSON、network reject 與 AbortError，並保留可判斷的錯誤類型。",
          },
          {
            criterion: "解釋 CORS 責任",
            passCondition: "能指出 origin 與 server allow policy，拒絕以 no-cors 當成讀取跨來源回應的通用解法。",
          },
        ],
      }),
      practice({
        slug: "js-autocomplete-capstone",
        title: "實作：Autocomplete",
        topic: "Capstone",
        dependsOn: ["js-fetch-http-cors"],
        examPoints: [
          "整合 debounce、DOM event、fetch 狀態與可取消請求",
          "快速輸入時維持 latest-request-wins，完整呈現 loading／error／empty／results",
        ],
        rubric: [
          {
            criterion: "互動與非同步狀態完整",
            passCondition: "debounce、loading、results、empty、HTTP error 與 network error 均可由測試觀察。",
          },
          {
            criterion: "stale response 不會覆蓋新結果",
            passCondition: "快速連續輸入會 abort 或忽略舊 request，且取消不顯示成使用者錯誤。",
          },
          {
            criterion: "DOM 與 cleanup 正確",
            passCondition: "事件 listener 可移除、結果以安全 DOM API 建立，銷毀後不再 commit UI。",
          },
        ],
        practiceBlueprint: {
          objective: "以 Vanilla JavaScript 實作可測試的 autocomplete controller，整合 debounce、fetch 與完整 UI state。",
          requirements: [
            "監聽輸入事件，trim query；空 query 取消 pending request 並清空結果",
            "使用可注入 scheduler 實作 debounce，快速輸入只送出最後一次 query",
            "每次新查詢取消前次 fetch，並以 request identity 防止無法取消的舊回應 commit",
            "檢查 Response.ok 與 JSON shape，分別渲染 loading、error、empty、results",
            "提供 destroy cleanup，移除 listener、timer 並 abort request",
          ],
          edgeCases: [
            "慢舊回應晚於快新回應完成時，UI 只能顯示新結果",
            "HTTP 500、network rejection 與 AbortError 必須走不同顯示策略",
            "成功但空陣列顯示 empty state；清空 query 不得殘留 loading",
            "輸入含前後空白與相同正規化 query 時不得產生不必要請求",
          ],
          starterSignature:
            "export function createAutocomplete({ input, results, fetchSuggestions, debounceMs, scheduler }): { destroy(): void }",
          timeboxMinutes: 40,
          followUps: [
            "如何加入 query cache、TTL 與 in-flight request deduplication？",
            "若結果數量很大，需要 keyboard navigation 與 accessibility，你會如何拆分狀態？",
            "在 React 中重寫時，哪些 lifecycle 與 stale closure 問題需要額外處理？",
          ],
        },
      }),
    ],
  },
];

export const javascriptInterviewCoreCurriculum: CurriculumPath = {
  id: "javascript-interview-core",
  title: "JavaScript Interview Core",
  description:
    "建立 JavaScript runtime 心智模型，練習輸出推理、非同步流程與瀏覽器整合面試題。",
  subject: "JavaScript",
  codeLanguage: "JavaScript",
  status: "published",
  position: 0,
  recommendedPrerequisitePathIds: [],
  defaultPracticeRuntime: "vanilla-js",
  units,
};
