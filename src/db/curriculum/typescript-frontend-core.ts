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

const practice = (
  value: Practice,
  practiceRuntime: "vanilla-ts" | "react-ts" = "vanilla-ts",
): CurriculumLesson => ({
  ...value,
  type: "practice",
  practiceRuntime,
});

const units: CurriculumUnit[] = [
  {
    slug: "typescript-type-system-model",
    title: "型別系統心智模型",
    lessons: [
      concept({
        slug: "ts-compile-time-runtime-erasure",
        title: "Compile Time、Runtime 與型別擦除",
        topic: "Type System",
        dependsOn: [],
        intro: {
          hook: "TypeScript 能在編輯器擋錯，但部署出去執行的仍是 JavaScript；這條界線決定你能相信哪些保證。",
          scenarios: [
            "解釋 interface、type annotation 與 generic 為何不會出現在瀏覽器中",
            "判斷一個資料安全問題該由 compiler、runtime validation 還是兩者共同處理",
          ],
          outcome: "能區分 TypeScript 靜態分析與 JavaScript runtime，拒絕把型別宣告當成執行期防護。",
        },
        examPoints: [
          "TypeScript 在 compile time 檢查 assignability，型別標註與 interface 會在 emit 時擦除",
          "型別錯誤通常不會自動改變 JavaScript runtime 行為；target 與 transpilation 也不等於資料驗證",
          "外部資料、環境變數與 storage 在 runtime 仍需檢查，不能只依賴靜態型別",
        ],
        rubric: [
          {
            criterion: "解釋型別擦除",
            passCondition: "能以 interface 或 generic 為例說明 compile 後不存在，且輸出仍由 JavaScript runtime 執行。",
          },
          {
            criterion: "選擇正確安全邊界",
            passCondition: "面對 API JSON 時同時指出 compile-time contract 與 runtime validation 的不同責任。",
          },
        ],
      }),
      concept({
        slug: "ts-inference-annotation-boundaries",
        title: "型別推論與標註邊界",
        topic: "Type System",
        dependsOn: ["ts-compile-time-runtime-erasure"],
        intro: {
          hook: "每個變數都手寫型別不會更安全，反而可能製造與實作分離的第二份真相。",
          scenarios: [
            "在 local constant、函式參數、公開 return type 與 API response 間選擇標註位置",
            "讀懂 widening、contextual typing 與 annotation 對 refactor feedback 的影響",
          ],
          outcome: "能讓 local implementation 交給 inference，並在真正的 contract boundary 主動標註。",
        },
        examPoints: [
          "compile time inference 從 initializer、return 與使用情境推導型別，不會建立 runtime metadata",
          "函式參數、公開 API、資料邊界與刻意限制的 union 是高價值 annotation 位置",
          "過度 annotation 可能擴寬 literal 或重複定義 shape；不足則可能讓 any 從邊界滲入",
        ],
        rubric: [
          {
            criterion: "選擇 annotation 位置",
            passCondition: "能比較 local constant 與 exported function boundary，說明何處應推論、何處應明示 contract。",
          },
          {
            criterion: "診斷推論失真",
            passCondition: "能指出 widening 或 any propagation 的 compile-time 後果，且不聲稱 annotation 會驗證 runtime 值。",
          },
        ],
      }),
      concept({
        slug: "ts-everyday-value-shapes",
        title: "Primitive、Array、Tuple 與 Object Shape",
        topic: "Everyday Types",
        dependsOn: ["ts-inference-annotation-boundaries"],
        intro: {
          hook: "`string`、`String`、`string[]` 和 tuple 看起來只差幾個字元，卻表達完全不同的 contract。",
          scenarios: [
            "為表單資料、座標 tuple、readonly 設定與 optional API 欄位建立 shape",
            "避免 wrapper object type、過寬 object 與把可變 array 誤當固定位置資料",
          ],
          outcome: "能用 everyday types 精準描述值形狀，並理解 readonly 只限制 compile-time 寫入。",
        },
        examPoints: [
          "使用 lowercase primitive types；wrapper objects 是不同的 runtime value，不該作一般資料 annotation",
          "array 表達同質集合，tuple 表達固定位置與長度；object property 可為 required、optional 或 readonly",
          "readonly 是 compile-time 約束且通常是 shallow，不會自動 Object.freeze runtime object",
        ],
        rubric: [
          {
            criterion: "選擇正確 shape",
            passCondition: "能為同質集合與固定位置資料分別選 array／tuple，並正確處理 optional property。",
          },
          {
            criterion: "解釋 readonly 邊界",
            passCondition: "能指出 readonly 的 compile-time shallow 限制與 runtime mutation 仍可能發生的原因。",
          },
        ],
      }),
      concept({
        slug: "ts-any-unknown-never-void",
        title: "any、unknown、never 與 void",
        topic: "Safety Types",
        dependsOn: ["ts-everyday-value-shapes"],
        intro: {
          hook: "這四個型別都不像一般 domain value，但它們分別代表關閉檢查、尚未證明、不可能發生與忽略回傳值。",
          scenarios: [
            "接收 JSON、catch error 或第三方 callback 時避免 any 污染",
            "用 never 做 exhaustiveness，並正確解讀 void callback contract",
          ],
          outcome: "能依 assignability 與控制流程選擇 safety type，而不是把 any 當萬用逃生門。",
        },
        examPoints: [
          "any 在 compile time 關閉檢查並向外傳播；unknown 可接收任意 runtime 值但使用前必須 narrow",
          "never 表示控制流程上不可達或沒有可能成員，可用於 exhaustive check",
          "void 表示呼叫端忽略回傳值，不等同函式在 runtime 必然回傳 undefined",
        ],
        rubric: [
          {
            criterion: "比較 any 與 unknown",
            passCondition: "能以外部輸入為例說明 unknown 為何保留 compile-time 防線，並完成必要 narrowing。",
          },
          {
            criterion: "解釋 never 與 void",
            passCondition: "能分別以 exhaustive branch 與 callback return contract 解釋兩者，不混淆 runtime throw 或 undefined。",
          },
        ],
      }),
      concept({
        slug: "ts-strict-nullability",
        title: "null、undefined 與 Optional",
        topic: "Safety Types",
        dependsOn: ["ts-any-unknown-never-void"],
        intro: {
          hook: "`strictNullChecks` 的價值不是讓你多寫 `!`，而是逼 contract 說清楚缺值在哪裡出現、誰負責處理。",
          scenarios: [
            "處理 querySelector、Map.get、optional prop 與尚未載入的資料",
            "在 optional chaining、nullish coalescing、guard 與提前 return 間選擇",
          ],
          outcome: "能把缺值納入型別與控制流程，避免 non-null assertion 掩蓋真實 runtime 分支。",
        },
        examPoints: [
          "strict null 在 compile time 將 null／undefined 保留為獨立成員；runtime 缺值行為仍是 JavaScript",
          "optional property 與 `T | undefined` 在可省略性上有差異，讀取時通常都需處理 undefined",
          "narrowing、`?.` 與 `??` 應依 domain contract 使用；`!` 不會新增 runtime 檢查",
        ],
        rubric: [
          {
            criterion: "設計缺值 contract",
            passCondition: "能為 DOM 或查找結果保留 null／undefined，並以 guard 或明確 fallback 處理。",
          },
          {
            criterion: "拒絕不安全 assertion",
            passCondition: "能指出 non-null assertion 只消音 compiler，並提出涵蓋 runtime 缺值的替代流程。",
          },
        ],
      }),
      concept({
        slug: "ts-assertions-runtime-validation",
        title: "Assertion 不等於 Validation",
        topic: "Runtime Boundary",
        dependsOn: ["ts-strict-nullability"],
        intro: {
          hook: "`JSON.parse(text) as User` 只是在告訴 compiler 相信你，伺服器少一個欄位時不會有任何東西替你擋下來。",
          scenarios: [
            "把 fetch、localStorage 與 postMessage 資料安全轉成 domain model",
            "審查 double assertion、as any 與手寫 type guard 是否真的覆蓋資料形狀",
          ],
          outcome: "能從 unknown 出發，以 runtime guard 或 parser 建立可被 TypeScript 信任的證據。",
        },
        examPoints: [
          "type assertion 只改變 compile-time 觀點，不轉換也不驗證 runtime value",
          "外部資料先視為 unknown，再以 typeof、property checks、schema parser 或 validator 建立 domain type",
          "custom type predicate 必須真的檢查 predicate 宣告的 shape；錯誤 guard 仍會欺騙 compiler",
        ],
        rubric: [
          {
            criterion: "辨認 assertion 風險",
            passCondition: "能說明 `as User`、double assertion 與 `as any` 都沒有 runtime 證據，且可能讓錯誤延後爆炸。",
          },
          {
            criterion: "實作 validation boundary",
            passCondition: "能從 unknown 檢查 object、必要欄位與欄位型別，成功後才回傳 domain value。",
          },
        ],
      }),
      practice({
        slug: "ts-unsafe-any-clinic",
        title: "實作：移除危險 any",
        topic: "Type Safety Lab",
        dependsOn: ["ts-assertions-runtime-validation"],
        examPoints: [
          "以 unknown、narrowing 與明確 contract 修復 JSON、catch error、nullable DOM 與 callback",
          "strict compile gate 與 runtime tests 均通過，且不使用 any、unchecked assertion 或 non-null assertion",
        ],
        rubric: [
          {
            criterion: "compile-time 逃生門已移除",
            passCondition: "不存在 explicit any、as any、double assertion 或 non-null assertion，所有 unknown 均先 narrow。",
          },
          {
            criterion: "runtime boundary 真實可驗證",
            passCondition: "JSON shape、catch value 與 nullable DOM 的失敗分支均由 runtime tests 觀察，非只靠型別宣告。",
          },
        ],
        practiceBlueprint: {
          objective: "修復一組充滿 any 與 assertion 的資料匯入工具，讓 strict compile diagnostics 與 runtime tests 同時通過。",
          requirements: [
            "將 JSON.parse 結果視為 unknown，驗證 profile object 與必要欄位後回傳明確 result union",
            "catch value 使用 unknown，安全產生使用者可讀訊息，支援 Error 與非 Error throw",
            "查找 DOM element 時處理 null，不得使用 non-null assertion",
            "為 callback 參數與 return 建立明確 contract，避免隱含或顯式 any 傳播",
            "不得使用 explicit any、as any、double assertion、ts-ignore 或 unchecked type assertion",
          ],
          edgeCases: [
            "輸入為 null、array、缺欄位、錯誤欄位型別與額外欄位時結果可預測",
            "catch 收到 string、number 或 plain object 時不存取不存在的 message",
            "DOM selector 找不到節點時回傳明確失敗，不在 runtime 拋 null property error",
            "runtime tests 可通過但保留 any／assertion 的版本必須被 compile/review gate 擋下",
          ],
          starterSignature:
            "export function parseProfile(input: unknown): { ok: true; value: Profile } | { ok: false; error: string }",
          timeboxMinutes: 35,
          followUps: [
            "若改用 schema library，static inference 與 runtime error formatting 如何分工？",
            "如何在大型 codebase 追蹤從第三方 declaration 滲入的 any？",
            "什麼情況下 narrow assertion 可接受，如何把它限制在 audited boundary？",
          ],
        },
      }),
    ],
  },
  {
    slug: "typescript-data-state-modeling",
    title: "資料形狀與狀態建模",
    lessons: [
      concept({
        slug: "ts-type-interface-structural-typing",
        title: "Type、Interface 與 Structural Typing",
        topic: "Data Modeling",
        dependsOn: ["ts-unsafe-any-clinic"],
        intro: {
          hook: "面試常問 type 還是 interface，但真正影響設計的是結構相容、擴充方式與 object literal 的檢查時機。",
          scenarios: [
            "為 domain object、component props 與可擴充 public contract 選擇宣告方式",
            "解釋同 shape 的不同物件為何相容，以及 excess property check 為何有時出現有時沒有",
          ],
          outcome: "能以能力與演進方式選 type／interface，並理解 structural typing 不提供 runtime nominal identity。",
        },
        examPoints: [
          "type alias 與 interface 都能描述 object shape；union 等組合通常需 type，declaration merging 是 interface 特性",
          "TypeScript 在 compile time 採 structural compatibility，成員足夠即可相容，不檢查 runtime class 名稱",
          "excess property check 主要針對 fresh object literal，不是所有 assignment 的一般 runtime validation",
        ],
        rubric: [
          {
            criterion: "比較 type 與 interface",
            passCondition: "能說明共同能力與 union／merging 差異，並依 closed domain 或擴充 contract 給出理由。",
          },
          {
            criterion: "推理 structural compatibility",
            passCondition: "能預測 object literal 與既有變數 assignment 的差異，且不把 excess check 當 runtime 檢查。",
          },
        ],
      }),
      concept({
        slug: "ts-function-contracts",
        title: "Function 與 Callback Contract",
        topic: "Functions",
        dependsOn: ["ts-type-interface-structural-typing"],
        intro: {
          hook: "callback 參數寫成 optional，常常不是在體貼呼叫端，而是在承諾『實作可能不傳它』。",
          scenarios: [
            "為 map-like callback、event handler、rest arguments 與 async function 設計 signature",
            "診斷 return inference、void assignability 與 optional callback parameter 的誤解",
          ],
          outcome: "能從呼叫者與實作者兩側閱讀 function type，建立可履行的參數與回傳 contract。",
        },
        examPoints: [
          "參數、return、optional、rest 與 overload 都是 compile-time call contract，不改變 runtime arity 行為",
          "callback parameter 的 `?` 表示提供者可能省略，consumer 必須能處理 undefined",
          "contextual typing 可推論 callback；void target 可接受有回傳值函式，代表呼叫端忽略該值",
        ],
        rubric: [
          {
            criterion: "設計 function signature",
            passCondition: "能標註必要、optional、rest 與 return，並讓 signature 符合實際 runtime 呼叫方式。",
          },
          {
            criterion: "解釋 callback contract",
            passCondition: "能指出 optional callback parameter 的責任方向，且正確解釋 void assignability。",
          },
        ],
      }),
      concept({
        slug: "ts-literal-union-modeling",
        title: "Literal、Union 與 Intersection",
        topic: "Data Modeling",
        dependsOn: ["ts-function-contracts"],
        intro: {
          hook: "`status: string` 接受拼字錯誤，也無法告訴 UI 有哪些分支；literal union 能把有限狀態直接放進 contract。",
          scenarios: [
            "建模權限、variant、request method 與 domain command",
            "判斷 intersection 是否真的能同時成立，避免組出互相衝突的 property",
          ],
          outcome: "能用 literal union 壓縮非法輸入，並把 intersection 限制在真正同時具備的能力。",
        },
        examPoints: [
          "literal types 與 union 在 compile time 表達有限集合，runtime 值仍是普通 string／number／object",
          "union 值只能直接使用所有成員共同安全的能力，需 narrowing 才能存取特有欄位",
          "intersection 要求同時滿足所有成員；衝突 property 可能縮成 never，並不等於物件 merge runtime 操作",
        ],
        rubric: [
          {
            criterion: "使用 literal union 建模",
            passCondition: "能把有限 string 狀態改成 union，並說明 compiler 能阻擋的非法值。",
          },
          {
            criterion: "判斷 union 與 intersection",
            passCondition: "能預測共同欄位與衝突 intersection 的 compile-time 結果，不宣稱型別運算會建立 runtime object。",
          },
        ],
      }),
      concept({
        slug: "ts-built-in-narrowing",
        title: "內建 Type Guards 與 Control Flow",
        topic: "Narrowing",
        dependsOn: ["ts-literal-union-modeling"],
        intro: {
          hook: "union 不是靠 assertion 拆開，而是讓控制流程從真實 runtime 檢查取得證據。",
          scenarios: [
            "處理 unknown、DOM event target、Error、array 與多種 API response shape",
            "避免 truthiness 把空字串或 0 這些合法值一起排除",
          ],
          outcome: "能選擇與 runtime 值相符的 guard，並讀懂 TypeScript control-flow narrowing。",
        },
        examPoints: [
          "typeof、`in`、instanceof、Array.isArray 與 equality 都執行 runtime 檢查，compiler 依分支縮窄型別",
          "truthiness narrowing 可能混入空字串、0、false 等合法 falsy domain value",
          "重新賦值、closure 與不精確 predicate 可能讓 compile-time narrowing 失效或不安全",
        ],
        rubric: [
          {
            criterion: "選擇 built-in guard",
            passCondition: "能依 primitive、array、class instance 或 property presence 選擇正確 runtime guard。",
          },
          {
            criterion: "診斷 narrowing 漏洞",
            passCondition: "能指出 truthiness 遺漏合法 falsy 值，並改用明確 null 或型別比較。",
          },
        ],
      }),
      concept({
        slug: "ts-discriminated-union-never",
        title: "Discriminated Union 與 Exhaustiveness",
        topic: "State Modeling",
        dependsOn: ["ts-built-in-narrowing"],
        intro: {
          hook: "三個 boolean 可以組出八種狀態，即使產品只允許 loading、success、error 三種；型別應直接排除其餘五種。",
          scenarios: [
            "建模 async UI、表單流程、reducer action 與 websocket message",
            "新增 variant 時用 never 讓遺漏的 render branch 在 compile time 失敗",
          ],
          outcome: "能以共同 discriminant 建立合法狀態集合，並讓 exhaustive check 保護後續擴充。",
        },
        examPoints: [
          "每個 union member 以共同 literal discriminant 表達互斥狀態，避免 nullable fields 與多 boolean 非法組合",
          "switch／if 對 discriminant 的 runtime 比較驅動 compile-time control-flow narrowing",
          "default branch 將剩餘值 assign 給 never，可在新增 variant 卻漏處理時產生 compile error",
        ],
        rubric: [
          {
            criterion: "建立互斥 state union",
            passCondition: "能將 loading／success／error 寫成各自只帶合法欄位的 variants，無非法組合。",
          },
          {
            criterion: "完成 exhaustiveness",
            passCondition: "能以 never 驗證所有分支，並解釋新增 variant 時 compile-time feedback 的來源。",
          },
        ],
      }),
      concept({
        slug: "ts-generics-relationships-constraints",
        title: "Generics 的關係與 Constraints",
        topic: "Generics",
        dependsOn: ["ts-discriminated-union-never"],
        intro: {
          hook: "generic 的價值不是『接受任何型別』，而是保存兩個以上位置之間原本會被 union 或 unknown 弄丟的關係。",
          scenarios: [
            "實作 identity、first、property getter 與 typed request wrapper",
            "判斷 type parameter 是否只出現一次、constraint 是否真的支援函式內操作",
          ],
          outcome: "能設計有資訊流關係的基本 generic，並用最小 constraint 表達實作需要的能力。",
        },
        examPoints: [
          "type parameter 在 compile time 連結 input、output 或多個參數位置，runtime 不會保留 T",
          "若 type parameter 只出現一次且不建立關係，具體型別、unknown 或 overload 可能更清楚",
          "`extends` constraint 限制可接受集合並允許安全操作，但不會在 runtime 自動驗證外部值",
        ],
        rubric: [
          {
            criterion: "解釋 generic 關係",
            passCondition: "能指出 T 在至少兩個位置保存的資訊，拒絕只回答『可以接任何型別』。",
          },
          {
            criterion: "設計最小 constraint",
            passCondition: "能依函式實際存取的 property 建立 extends constraint，且不假設它提供 runtime validation。",
          },
        ],
      }),
      practice({
        slug: "ts-async-state-machine-lab",
        title: "實作：Async State Machine",
        topic: "State Modeling Lab",
        dependsOn: ["ts-generics-relationships-constraints"],
        examPoints: [
          "將多 boolean 與 nullable 欄位重構成帶 discriminant 的互斥 async state",
          "strict compile gate 驗證所有 variant、transition 與 exhaustive render，runtime tests 驗證實際輸出",
        ],
        rubric: [
          {
            criterion: "state model 排除非法組合",
            passCondition: "loading／success／error variants 各自只含合法資料，沒有 any、unchecked assertion 或平行 boolean。",
          },
          {
            criterion: "transition 與 render exhaustive",
            passCondition: "所有 event transition 與 render branch 可判定，新增 variant 時 never check 會在 compile time 擋下遺漏。",
          },
        ],
        practiceBlueprint: {
          objective: "把容易產生 data/error/loading 衝突的 async model 重構成 generic discriminated union、typed transition 與 exhaustive renderer。",
          requirements: [
            "定義 idle、loading、success、error 四個以 status 區分的互斥 state variants",
            "success 只攜帶 data，error 只攜帶可呈現 error，其他 variants 不得保留 stale payload",
            "定義 typed events 與 transition function，非法 event/state 組合需保持可預測或被 contract 排除",
            "renderer 必須處理每個 variant並以 never 完成 exhaustive check",
            "不得使用 explicit any、unchecked assertion、non-null assertion 或多 boolean 取代 union",
          ],
          edgeCases: [
            "空陣列仍是成功，不得因 truthiness 誤判為 idle 或 error",
            "retry 從 error 進 loading 時清除舊 error，成功後不得殘留 error",
            "runtime tests 全過但移除一個 render branch 時，compile diagnostics 必須失敗",
            "加入新 event 或 state variant 時，未更新 transition／render 應產生可定位的 diagnostics",
          ],
          starterSignature:
            "export type AsyncState<T> = ...; export function transition<T>(state: AsyncState<T>, event: AsyncEvent<T>): AsyncState<T>",
          timeboxMinutes: 40,
          followUps: [
            "若 request 可以同時存在多個 key，state machine 要如何正規化？",
            "在 React reducer 中如何維持同一 contract，而不重教 reducer runtime 行為？",
            "哪些 transition 適合在 type level 排除，哪些仍需 runtime policy？",
          ],
        },
      }),
    ],
  },
  {
    slug: "typescript-derived-react-boundaries",
    title: "衍生型別與 React 邊界",
    lessons: [
      concept({
        slug: "ts-keyof-indexed-access",
        title: "keyof、typeof 與 Indexed Access",
        topic: "Derived Types",
        dependsOn: ["ts-async-state-machine-lab"],
        intro: {
          hook: "同一組欄位名稱同時手寫在 object、union 與函式參數，三份定義遲早會漂移；衍生型別讓來源只保留一份。",
          scenarios: [
            "從設定 object、API model 與 `as const` lookup table 衍生 key/value types",
            "實作型別安全 property getter，不把 key 擴成任意 string",
          ],
          outcome: "能從既有 value 或 object type 衍生 key 與 value 關係，減少重複 contract。",
        },
        examPoints: [
          "`keyof T` 在 compile time 產生已知 property key union；indexed access `T[K]` 取得對應 value type",
          "type position 的 `typeof value` 讀取靜態型別，不是 runtime `typeof` 字串運算",
          "`as const` 可保留 literal 與 readonly inference，但不會 deep freeze runtime data",
        ],
        rubric: [
          {
            criterion: "衍生 key/value 型別",
            passCondition: "能以 keyof、typeof 與 indexed access 從單一來源建立 property getter 或 lookup value union。",
          },
          {
            criterion: "區分兩種 typeof",
            passCondition: "能說明 type query 與 runtime operator 的輸出及使用位置，且不誤解 as const 的 runtime 效果。",
          },
        ],
      }),
      concept({
        slug: "ts-core-utility-types",
        title: "常用 Utility Types",
        topic: "Derived Types",
        dependsOn: ["ts-keyof-indexed-access"],
        intro: {
          hook: "建立、更新、列表摘要與權限 lookup 常是同一 domain shape 的不同視圖，不需要複製四份 interface。",
          scenarios: [
            "為 patch payload、public view、表單 draft 與 keyed registry 選擇 utility type",
            "辨認 Partial 讓所有欄位 optional 是否真的符合 domain 更新規則",
          ],
          outcome: "能用核心 utility types 衍生簡單視圖，同時知道它們是 shallow compile-time transformation。",
        },
        examPoints: [
          "Partial、Required、Readonly、Pick、Omit 與 Record 在 compile time 重組 property contract",
          "utility types 通常是 shallow，不會轉換、刪除或 freeze runtime object property",
          "先由 domain invariant 選 utility；Partial 並不適合每一種 patch，Record 也要求完整 key set",
        ],
        rubric: [
          {
            criterion: "選擇適當 utility",
            passCondition: "能依 create／patch／public view／lookup 情境選擇 utility，並指出不該全域 Partial 的理由。",
          },
          {
            criterion: "解釋 transformation 邊界",
            passCondition: "能指出 utility type 的 shallow compile-time 性質，runtime payload 仍需實際轉換與驗證。",
          },
        ],
      }),
      concept({
        slug: "ts-react-typed-boundaries",
        title: "React Props、State、Event、Ref 與 API Boundary",
        topic: "React + TypeScript",
        dependsOn: ["ts-core-utility-types"],
        intro: {
          hook: "React 行為已由 React 路徑負責；這一站只處理資料穿過 props、state、event、ref 與 API 時，型別 contract 放在哪裡。",
          scenarios: [
            "設計 component props、children、useState inference、form event 與 nullable ref",
            "讓 unknown API response 經 validation 後才能進入 typed UI state",
          ],
          outcome: "能在常見 React boundary 使用 inference 與明確 contract，不用 React.FC、any 或 assertion 掩蓋問題。",
        },
        examPoints: [
          "props 與 children 是 compile-time component contract；local state 優先 inference，空值或 union 初始狀態才主動給 type argument",
          "event handler 使用具體 React event type 並優先 currentTarget；ref 的 current 在 runtime 可能為 null",
          "fetch response 先以 unknown 經 runtime validation，再寫入 discriminated async state；型別不重教 effect 或 fetch 行為",
        ],
        rubric: [
          {
            criterion: "標註 React boundaries",
            passCondition: "能正確處理 props、children、state union、currentTarget 與 nullable ref，且善用 inference。",
          },
          {
            criterion: "保護 API 到 UI 邊界",
            passCondition: "unknown response 經 runtime parser 後才進 typed state，不使用 as、any 或 non-null assertion。",
          },
        ],
      }),
      practice(
        {
          slug: "ts-typed-data-page-capstone",
          title: "實作：Typed Data Page",
          topic: "React Type Safety Capstone",
          dependsOn: ["ts-react-typed-boundaries"],
          examPoints: [
            "從 unknown API response 建立 runtime parser、domain model 與 exhaustive React async state",
            "strict compile diagnostics 與 runtime/component tests 均通過，且不以 any 或 assertion 假造安全",
          ],
          rubric: [
            {
              criterion: "API boundary 同時具備 runtime 與 compile-time 證據",
              passCondition: "response 以 unknown 進入 parser，必要欄位與集合成員皆驗證後才成為 domain model。",
            },
            {
              criterion: "React state 與 render exhaustive",
              passCondition: "loading／success／empty／error 為互斥 variants，event/ref/props 正確且沒有 any、unchecked assertion 或 non-null assertion。",
            },
          ],
          practiceBlueprint: {
            objective: "完成一個從 unknown API response 到 typed React UI 的資料頁，具 runtime validation、互斥 async state 與 exhaustive rendering。",
            requirements: [
              "fetcher contract 回傳 unknown，建立 parser 驗證 response object、items array 與每個 domain item",
              "定義 typed domain model，並從 parser 成功結果建立 success 或 empty state",
              "以 discriminated union 表達 loading、success、empty、error，render 對所有 variants exhaustive",
              "component props、button/form event 與 nullable ref 使用具體型別並優先 inference／currentTarget",
              "不得使用 explicit any、as any、double assertion、unchecked assertion、non-null assertion 或 hard-code 測試資料",
            ],
            edgeCases: [
              "response 為 null、array、缺 items、items 非 array 或 item 欄位型別錯誤時進 error state",
              "合法空 items 顯示 empty，不得與 loading 或 error 共存",
              "runtime component tests 通過但 parser 改為 assertion 時，AI review 必須判 fail",
              "ref 尚未掛載與 optional display field 缺失時不得產生 runtime error",
            ],
            starterSignature:
              "export function parseItems(input: unknown): ParseResult<Item[]>; export default function TypedDataPage({ fetchItems }: Props): JSX.Element",
            timeboxMinutes: 50,
            followUps: [
              "若加入 pagination 與 request identity，如何擴充 state 而不產生非法組合？",
              "schema parser 的 inferred type 與 domain type 應何時分開？",
              "在 Next.js Server Component 中，validation boundary 與 client serialization 應放在哪裡？",
            ],
          },
        },
        "react-ts",
      ),
    ],
  },
];

export const typescriptFrontendCoreCurriculum: CurriculumPath = {
  id: "typescript-frontend-core",
  title: "TypeScript Frontend Core",
  description:
    "建立 TypeScript 靜態型別心智模型，練習安全資料邊界、狀態建模與 React 型別整合。",
  subject: "TypeScript",
  codeLanguage: "TypeScript",
  status: "published",
  position: 1,
  recommendedPrerequisitePathIds: ["javascript-interview-core"],
  defaultPracticeRuntime: "vanilla-ts",
  units,
};
