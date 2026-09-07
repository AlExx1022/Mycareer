import type { CurriculumLesson, CurriculumPath, CurriculumUnit } from "./types";

type Concept = Omit<Extract<CurriculumLesson, { type: "concept" }>, "type">;
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
  practiceRuntime: "python",
});

const units: CurriculumUnit[] = [
  {
    slug: "python-objects-data",
    title: "Python 物件與資料",
    lessons: [
      concept({
        slug: "py-syntax-truthiness-control-flow",
        title: "Python 語法、Truthiness 與控制流程",
        topic: "Language Fundamentals",
        dependsOn: [],
        intro: {
          hook: "會寫 JavaScript 的人通常不是卡在 Python 縮排，而是把 `None`、短路回傳值與迭代規則想成 JavaScript。",
          scenarios: [
            "把巢狀條件重寫成 guard clause，並分辨 falsy 值是否代表無效資料",
            "在 Pyodide 練習可攜 Python，同時知道它不是完整的本機 OS 環境",
          ],
          outcome: "能以 Python 語意預測條件與迴圈結果，並清楚標示 browser runner 與本機 Python 的邊界。",
        },
        examPoints: [
          "縮排形成 block；`None` 應以 `is None` 判斷，空容器、零與空字串為 falsy，但可能仍是合法 domain value",
          "`and`／`or` 會短路並回傳 operand；`for` 直接消費 iterable，`while` 必須明確維護終止條件",
          "Pyodide 執行 Python 語言與部分標準函式庫，但不等同本機 socket、subprocess 或 OS runtime",
        ],
        rubric: [
          {
            criterion: "預測 Python 控制流程",
            passCondition: "能逐步說明 truthiness、短路與 loop termination，不套用 JavaScript 的 truthy/coercion 細節。",
          },
          {
            criterion: "說明執行環境邊界",
            passCondition: "能區分可攜純 Python 與 Pyodide／本機環境能力，不假設 browser runner 可執行 OS 功能。",
          },
        ],
      }),
      concept({
        slug: "py-binding-mutability",
        title: "名稱綁定、可變與不可變",
        topic: "Object Model",
        dependsOn: ["py-syntax-truthiness-control-flow"],
        intro: {
          hook: "Python assignment 綁定名稱而不是複製物件；aliasing bug 往往來自改了共享 list，卻以為只改一個變數。",
          scenarios: [
            "追蹤兩個名稱指向同一 list 時 append、rebinding 與 shallow copy 的差異",
            "解釋 tuple 本身不可變，但其中可變成員仍可能改變",
          ],
          outcome: "能以 object identity 與 name binding 解釋 mutation，不用 JavaScript primitive/reference 的模糊二分法代替。",
        },
        examPoints: [
          "assignment 讓名稱指向 object；rebinding 改變名稱指向，mutation 則改變同一 mutable object 的狀態",
          "list／dict／set 通常可變，str／int／tuple 本身不可變；shallow copy 不會遞迴複製巢狀成員",
        ],
        rubric: [
          {
            criterion: "追蹤 alias 與 mutation",
            passCondition: "能畫出名稱與 object 關係，正確預測 append、slice copy 與 rebinding 後各名稱看到的值。",
          },
          {
            criterion: "解釋 shallow boundary",
            passCondition: "能指出外層 copy 與巢狀 mutable member 共享的差異，並提出符合 domain 的複製策略。",
          },
        ],
      }),
      concept({
        slug: "py-equality-identity-hashability",
        title: "==、is 與 Hashability",
        topic: "Object Model",
        dependsOn: ["py-binding-mutability"],
        intro: {
          hook: "`==` 問值是否相等，`is` 問是不是同一個 object；拿字串 interning 的偶然結果當規則，是常見面試陷阱。",
          scenarios: [
            "選擇 `==` 或 `is None`，避免依賴 implementation caching",
            "判斷一個值能否作為 dict key 或 set member，以及 mutation 為何會破壞 hash contract",
          ],
          outcome: "能分開 value equality、identity 與 hash stability，正確設計 lookup key。",
        },
        examPoints: [
          "`==` 可由型別定義值相等；`is` 比較 identity，語意上主要用於 `None` 等 singleton sentinel",
          "hashable object 需在生命週期內維持相容的 hash／equality；mutable list、dict、set 不可直接作 key",
        ],
        rubric: [
          {
            criterion: "區分 equality 與 identity",
            passCondition: "能解釋兩個內容相同 list 的 `==` 與 `is` 結果，且不依賴小整數或字串 cache。",
          },
          {
            criterion: "判斷 hashability",
            passCondition: "能依 mutation 與 equality contract 判定 dict／set key，並說明 tuple 含 unhashable member 的結果。",
          },
        ],
      }),
      concept({
        slug: "py-collections-selection",
        title: "List、Tuple、Dict、Set 怎麼選",
        topic: "Collections",
        dependsOn: ["py-equality-identity-hashability"],
        intro: {
          hook: "資料結構題不是背語法，而是把順序、唯一性、查找與更新成本翻成具體 contract。",
          scenarios: [
            "為技能清單去重且保序，或用 frequency map 統計職缺需求",
            "依 membership、index access、append 與 key lookup 的複雜度選 collection",
          ],
          outcome: "能依 observable requirements 選內建 collection，並以平均或最壞 Big-O 說明取捨。",
        },
        examPoints: [
          "list 保序且適合線性序列，tuple 表達固定不可變 record，dict 做 key-value lookup，set 做唯一性與 membership",
          "list membership 通常 O(n)，dict／set 平均 lookup O(1)；排序通常 O(n log n)，但 Big-O 不取代可讀性與資料量判斷",
        ],
        rubric: [
          {
            criterion: "由需求選 collection",
            passCondition: "能針對保序去重、frequency 與 queue 情境分別選結構，說明被保留與被犧牲的性質。",
          },
          {
            criterion: "解釋操作成本",
            passCondition: "能給出核心 lookup／append／sort 的 Big-O，並說明 hash collision 與輸入規模限制。",
          },
        ],
      }),
      concept({
        slug: "py-pythonic-iteration-transform",
        title: "Pythonic 迭代與轉換",
        topic: "Collections",
        dependsOn: ["py-collections-selection"],
        intro: {
          hook: "把 index loop 原封不動搬到 Python 通常能跑，卻失去 iterable protocol、穩定排序與清楚轉換意圖。",
          scenarios: [
            "用 enumerate／zip／unpacking 同步處理資料，不手動維護 index",
            "在 comprehension、generator expression、sorted key 與 any／all 間選擇",
          ],
          outcome: "能寫出保留資料語意的 Pythonic transformation，並辨認何時展開成一般 loop 更清楚。",
        },
        examPoints: [
          "slicing 建立新序列，unpacking 依 arity 解構；enumerate 與 zip 以 iterable 為核心且 zip 預設在最短輸入停止",
          "comprehension 建立 collection，generator expression 惰性產值；`sorted(..., key=...)` 穩定且不改原序列",
          "`any`／`all` 短路；過度巢狀 comprehension 應改寫成有名稱的步驟以保留可讀性",
        ],
        rubric: [
          {
            criterion: "選擇迭代工具",
            passCondition: "能把 index loop 改為 enumerate／zip／unpacking，並正確解釋長度不一致與 slicing copy。",
          },
          {
            criterion: "維持轉換可讀性",
            passCondition: "能在 comprehension、generator 與明確 loop 間取捨，並說明排序 key 與穩定性的結果。",
          },
        ],
      }),
      practice({
        slug: "py-job-skills-normalizer",
        title: "實作：職缺技能資料正規化",
        topic: "Data Normalization Lab",
        dependsOn: ["py-pythonic-iteration-transform"],
        examPoints: [
          "以 dict／set 與 stable sorting 正規化技能資料，同時保存可解釋的輸出順序",
          "在 Pyodide 純 Python runtime 通過 malformed／empty／duplicate cases，並口述時間與空間複雜度",
        ],
        rubric: [
          {
            criterion: "正規化規則一致",
            passCondition: "trim、case folding、synonym mapping、去重與分組順序皆集中實作，不以測資特例硬編碼。",
          },
          {
            criterion: "資料結構與複雜度合理",
            passCondition: "使用 dict／set 支援查找並維持穩定輸出，可說明 n 筆技能下的時間與額外空間。",
          },
        ],
        practiceBlueprint: {
          objective: "實作職缺技能正規化器，把來源不一致的技能字串轉成可穩定比較與統計的資料。",
          requirements: [
            "輸入為多組職缺技能 iterable，trim 並以 casefold 建立 canonical key",
            "套用明確 synonym mapping，例如 js 到 javascript；未知技能保留正規化名稱",
            "同一職缺內去重，跨職缺計算 frequency，輸出依 frequency 降冪再依名稱升冪",
            "回傳純 Python dict／list 結構，不依賴 network、filesystem、socket、subprocess 或第三方 package",
            "附上時間與空間複雜度說明，不使用硬編測資分支",
          ],
          edgeCases: [
            "空輸入、空白技能與同一技能不同大小寫",
            "多個 alias 指向同一 canonical skill，且同一職缺重複出現",
            "frequency 相同時輸出順序仍 deterministic",
          ],
          starterSignature:
            "def normalize_job_skills(jobs: list[list[str]], aliases: dict[str, str]) -> list[dict[str, object]]:",
          timeboxMinutes: 35,
          followUps: [
            "若資料量無法一次放入記憶體，如何改成 streaming aggregation？",
            "說明主要 loop、hash lookup 與最終排序的 Big-O。",
          ],
        },
      }),
    ],
  },
  {
    slug: "python-functions-laziness",
    title: "函式、Scope 與惰性運算",
    lessons: [
      concept({
        slug: "py-function-signatures",
        title: "Python 函式簽名",
        topic: "Functions",
        dependsOn: ["py-job-skills-normalizer"],
        intro: {
          hook: "Python signature 不只列參數；`/` 與 `*` 能把呼叫方式本身變成可演進的 API contract。",
          scenarios: [
            "設計 positional-only、keyword-only、default 與 variadic 參數",
            "避免把 `*args`／`**kwargs` 當成逃避命名與 validation 的萬用入口",
          ],
          outcome: "能從 caller 與 implementation 兩側設計可讀、可相容的函式介面。",
        },
        examPoints: [
          "`/` 前為 positional-only、單獨 `*` 後為 keyword-only；default parameter 必須位於可省略的位置並在定義時建立",
          "`*args` 收集 positional tuple、`**kwargs` 收集 keyword dict；unpacking 呼叫仍需滿足名稱與重複參數規則",
        ],
        rubric: [
          {
            criterion: "設計明確 signature",
            passCondition: "能依穩定名稱與呼叫可讀性選 positional／keyword boundary，不濫用 variadic parameter。",
          },
          {
            criterion: "預測 argument binding",
            passCondition: "能判定重複、缺少與未知 argument 何時拋 TypeError，並與 JavaScript 寬鬆 arity 區分。",
          },
        ],
      }),
      concept({
        slug: "py-mutable-default-trap",
        title: "Mutable Default Argument",
        topic: "Functions",
        dependsOn: ["py-function-signatures"],
        intro: {
          hook: "default list 只建立一次，不是每次呼叫建立；這個 bug 是 name binding 與函式物件生命週期的直接結果。",
          scenarios: [
            "預測連續呼叫共享 default list 的輸出",
            "用 `None` sentinel 或 dataclass `default_factory` 建立每次獨立狀態",
          ],
          outcome: "能解釋 mutable default 的建立時機、觀察共享狀態並選擇正確修復。",
        },
        examPoints: [
          "default expression 在 `def` 執行時求值並保存於函式物件，不會在每次 call 重新求值",
          "需要 per-call mutable value 時使用 `None` sentinel 後建立；刻意 cache 時應明確命名與封裝共享狀態",
        ],
        rubric: [
          {
            criterion: "預測跨呼叫狀態",
            passCondition: "能逐次列出共享 list／dict default 的內容並指出建立於函式定義階段。",
          },
          {
            criterion: "選擇修復策略",
            passCondition: "能用 sentinel 或 factory 修復且不以 truthiness 誤傷合法空容器。",
          },
        ],
      }),
      concept({
        slug: "py-legb-closure-late-binding",
        title: "LEGB、Closure 與 Late Binding",
        topic: "Scope",
        dependsOn: ["py-mutable-default-trap"],
        intro: {
          hook: "loop 裡建立的多個 lambda 都拿到最後一個值，不是 lambda 壞掉，而是 closure 在呼叫時查同一個名稱。",
          scenarios: [
            "依 Local、Enclosing、Global、Builtins 解析名稱，辨認 shadowing",
            "修復 loop closure late binding，並正確使用 nonlocal／global",
          ],
          outcome: "能以 cell/name lookup 解釋 closure，而不是誤稱 Python 會把值自動 copy 進函式。",
        },
        examPoints: [
          "名稱解析依 LEGB；assignment 預設建立 local binding，`nonlocal` 修改最近 enclosing binding，`global` 指向 module namespace",
          "closure 捕捉 binding 且通常 late lookup；可用 helper scope 或刻意的 immutable default snapshot 固定每輪值",
        ],
        rubric: [
          {
            criterion: "追蹤 LEGB lookup",
            passCondition: "能指出每個名稱的來源與 assignment 影響，不把 JavaScript `var`／`let` 規則直接套用。",
          },
          {
            criterion: "修復 late binding",
            passCondition: "能解釋為何 callbacks 看到最後值，並以 helper scope 或明確 snapshot 修正。",
          },
        ],
      }),
      concept({
        slug: "py-iterable-iterator-generator",
        title: "Iterable、Iterator 與 Generator",
        topic: "Lazy Evaluation",
        dependsOn: ["py-legb-closure-late-binding"],
        intro: {
          hook: "list 可以反覆走訪，generator 通常只能消耗一次；把兩者都叫 array 會漏掉 state 與 memory trade-off。",
          scenarios: [
            "用 `iter`／`next` 追蹤 iterator state 與 StopIteration",
            "以 `yield` 建立 lazy pipeline，避免一次 materialize 大量資料",
          ],
          outcome: "能區分 iterable 與 iterator，正確處理一次性消耗、惰性例外與記憶體成本。",
        },
        examPoints: [
          "iterable 能產生 iterator；iterator 的 `__next__` 推進狀態並以 StopIteration 結束，generator 是 iterator 的常見實作",
          "generator function 呼叫時先回傳 generator，body 在迭代時執行；lazy pipeline 降低 peak memory 但錯誤也可能延後發生",
          "需要重複走訪或隨機存取時應 materialize；不要在檢查後誤以為一次性 iterator 仍完整",
        ],
        rubric: [
          {
            criterion: "辨認 protocol 與 state",
            passCondition: "能說明 iterable、iterator、generator 的關係，並預測兩次消耗同一 iterator 的結果。",
          },
          {
            criterion: "評估 lazy trade-off",
            passCondition: "能比較 generator 與 list 的執行時機、peak memory、重用與錯誤定位。",
          },
        ],
      }),
      concept({
        slug: "py-decorator-fundamentals",
        title: "Decorator 的本質",
        topic: "Functions",
        dependsOn: ["py-iterable-iterator-generator"],
        intro: {
          hook: "decorator 不是特殊框架魔法，而是接收 function、回傳 function，並在定義階段重新綁定名稱。",
          scenarios: [
            "手動展開 `@decorator`，追蹤 wrapper closure 與呼叫順序",
            "用 `functools.wraps` 保留名稱與文件，不讓 instrumentation 改變 domain 結果",
          ],
          outcome: "能實作最小 decorator、保存 metadata，並判斷 cross-cutting behavior 是否值得包裝。",
        },
        examPoints: [
          "`@log` 等價於定義後執行 `func = log(func)`；帶參數 decorator 再多一層 factory closure",
          "wrapper 應轉送 `*args`／`**kwargs` 與 return／exception，並以 `functools.wraps` 保留 introspection metadata",
        ],
        rubric: [
          {
            criterion: "展開 decorator 綁定",
            passCondition: "能說明 decoration time 與 call time，並依序追蹤 outer factory、decorator、wrapper。",
          },
          {
            criterion: "維持原函式 contract",
            passCondition: "wrapper 正確轉送參數、回傳與例外，且使用 wraps；不把核心 domain logic 藏進 decorator。",
          },
        ],
      }),
      practice({
        slug: "py-lazy-pipeline-lab",
        title: "實作：惰性資料 Pipeline",
        topic: "Lazy Pipeline Lab",
        dependsOn: ["py-decorator-fundamentals"],
        examPoints: [
          "以 generator 逐筆清理與篩選職缺資料，保留一次性消耗與例外時機",
          "以 wraps decorator 收集可注入的觀測資料，並修復 mutable default／late binding 陷阱",
        ],
        rubric: [
          {
            criterion: "pipeline 真正惰性",
            passCondition: "各 stage 以 iterator/generator 串接，不在入口偷偷 list 化，且可處理一次性來源。",
          },
          {
            criterion: "closure 與 decorator 安全",
            passCondition: "沒有共享 mutable default 或 late-bound loop callback，wrapper 保留 metadata 與原 return/exception。",
          },
        ],
        practiceBlueprint: {
          objective: "建立逐筆處理職缺紀錄的 lazy pipeline，並以小型 decorator 記錄 stage 行為。",
          requirements: [
            "用 generator stages 完成 trim、filter、mapping，入口接受任意 iterable 而非只接受 list",
            "輸入資料直到實際 iteration 才被消耗，不可在 pipeline 建立時 materialize",
            "decorator 使用 functools.wraps 並透傳參數、回傳與例外；metrics sink 由參數注入",
            "建立多個 mapping callbacks 時避免 late binding，所有 mutable state 皆為 per-run",
            "只使用純 Python 與標準函式庫；提供 O(n) 處理與 peak memory 說明",
          ],
          edgeCases: [
            "空 iterator 與只能消耗一次的 generator input",
            "中途資料格式錯誤時，例外在對應元素被消耗時才出現",
            "連續執行兩次 pipeline 不共享 metrics 或輸出容器",
          ],
          starterSignature:
            "def build_pipeline(rows: Iterable[dict[str, object]], metrics: Callable[[str], None]) -> Iterator[dict[str, object]]:",
          timeboxMinutes: 40,
          followUps: [
            "若 stage 需要 retry 或 fan-out，如何維持 lazy contract 與可觀測性？",
            "比較 generator pipeline 與 list comprehension 的時間、peak memory 與除錯取捨。",
          ],
        },
      }),
    ],
  },
  {
    slug: "python-engineering-boundaries",
    title: "模組、錯誤、型別與測試",
    lessons: [
      concept({
        slug: "py-exceptions-context-managers",
        title: "Exception 與 Context Manager",
        topic: "Error Handling",
        dependsOn: ["py-lazy-pipeline-lab"],
        intro: {
          hook: "`except Exception: pass` 讓程式看似穩定，實際上把最重要的 failure signal 與不完整輸出一起吞掉。",
          scenarios: [
            "在 parse boundary 精確轉換例外並保留 exception chaining",
            "用 `with` 保證檔案或自訂資源在成功、失敗時都釋放",
          ],
          outcome: "能設計可診斷的 exception boundary，並以 context manager 管理生命週期。",
        },
        examPoints: [
          "只 catch 可處理的具體例外；`raise ... from error` 保留 cause，`finally` 一定執行但不應以 return 蓋掉原例外",
          "context manager 透過 enter／exit 保證 cleanup；`with` 不代表自動吞例外，是否 suppress 由 exit 回傳決定",
        ],
        rubric: [
          {
            criterion: "建立精確錯誤邊界",
            passCondition: "能區分可恢復輸入錯誤與程式缺陷，保留 cause 並拒絕 bare except／silent pass。",
          },
          {
            criterion: "管理資源生命週期",
            passCondition: "能說明 with 在正常與例外路徑都 cleanup，且不誤稱 context manager 一定 suppress exception。",
          },
        ],
      }),
      concept({
        slug: "py-modules-packages-imports",
        title: "Module、Package 與 Import",
        topic: "Modules",
        dependsOn: ["py-exceptions-context-managers"],
        intro: {
          hook: "import 不是文字貼上；module code 首次載入會執行並建立 namespace，side effect 會影響測試與 CLI 啟動。",
          scenarios: [
            "拆分 parser、domain、reporter 並避免 circular import",
            "用 `if __name__ == '__main__'` 區分可 import 模組與直接執行入口",
          ],
          outcome: "能設計小型 package namespace，控制 import-time side effects 與 entry point。",
        },
        examPoints: [
          "module 是具 namespace 的 object，首次 import 執行 top-level code 並快取於 `sys.modules`；重複 import 通常不重跑",
          "package 組織 import path；`__init__.py` 可定義 public surface，但不應塞入昂貴 side effect",
          "main guard 只在直接執行 module 時成立，讓 pure functions 可安全被測試 import",
        ],
        rubric: [
          {
            criterion: "追蹤 import 行為",
            passCondition: "能說明首次執行、module cache 與 namespace，不把 ES module 細節直接套用。",
          },
          {
            criterion: "切分 package 邊界",
            passCondition: "parser／domain／reporter／CLI 依責任分離，import 時不讀檔、不解析 argv、不輸出。",
          },
        ],
      }),
      concept({
        slug: "py-venv-pyproject-dependencies",
        title: "venv、pyproject 與依賴",
        topic: "Packaging",
        dependsOn: ["py-modules-packages-imports"],
        intro: {
          hook: "程式在自己電腦能跑不代表專案可重現；interpreter、環境與 dependency contract 必須能被另一台機器建立。",
          scenarios: [
            "建立隔離 venv，解釋 interpreter 與 installed packages 的關係",
            "在 pyproject 宣告 metadata、Python version、runtime 與 test dependency groups",
          ],
          outcome: "能描述現代 Python 專案的最小可重現結構，不綁死特定 package manager。",
        },
        examPoints: [
          "venv 隔離 interpreter environment 與 site-packages，但不自動鎖定所有 transitive versions 或取代 source control",
          "`pyproject.toml` 集中 build-system、project metadata、dependencies 與工具設定；dependency group 與 runtime dependency 責任不同",
          "Pyodide practice 不模擬本機 package installation；本機 capstone 必須在隔離環境安裝並跑 pytest",
        ],
        rubric: [
          {
            criterion: "解釋環境隔離",
            passCondition: "能指出 venv 解決什麼、不解決什麼，並驗證目前 python/pip 指向預期環境。",
          },
          {
            criterion: "設計 pyproject contract",
            passCondition: "能分開 runtime 與 test dependencies、Python version 與 CLI entry point，不宣稱 browser runner 等同本機安裝。",
          },
        ],
      }),
      concept({
        slug: "py-type-hints-runtime-boundary",
        title: "Python Type Hints",
        topic: "Typing",
        dependsOn: ["py-venv-pyproject-dependencies"],
        intro: {
          hook: "函式標註 `count: int` 後，runtime 預設仍可收到字串；annotation 是工具可讀 contract，不是輸入驗證器。",
          scenarios: [
            "用 union、collection、Callable 與 TypedDict 描述 application boundary",
            "區分 static checker finding 與 JSON／CSV runtime validation",
          ],
          outcome: "能寫實用 type hints 並清楚說明 annotation、static analysis 與 runtime check 的責任。",
        },
        examPoints: [
          "Python annotation 可供 checker、IDE 與 introspection 使用，預設不阻止 runtime 傳入不相容值",
          "`T | None`、具體 collection element、Callable 與 TypedDict 能描述常見 contract；外部資料仍需 parse/validate",
          "避免為了炫技加入進階 generic／Protocol；核心 domain 以可讀、可檢查的 annotation 為優先",
        ],
        rubric: [
          {
            criterion: "標註實用 boundary",
            passCondition: "能為 parser、domain 與 reporter 寫出具體輸入輸出，避免裸 list／dict 與無意義 Any。",
          },
          {
            criterion: "區分 static 與 runtime",
            passCondition: "能示範 annotation 不會自動拒絕錯值，並在 JSON／CSV boundary 補實際 validation。",
          },
        ],
      }),
      concept({
        slug: "py-testing-fixtures-boundaries",
        title: "pytest、Fixture 與 Mock Boundary",
        topic: "Testing",
        dependsOn: ["py-type-hints-runtime-boundary"],
        intro: {
          hook: "mock 越多不代表 unit test 越純；若連核心轉換都 mock，測到的只剩 implementation choreography。",
          scenarios: [
            "以 Arrange-Act-Assert、parametrize 與 fixture 測成功、邊界與失敗案例",
            "只在 filesystem、network、time 等 adapter boundary 使用 fake／mock",
          ],
          outcome: "能建立隔離、可讀且對行為敏感的測試，不把 browser assertion harness 冒充完整 pytest。",
        },
        examPoints: [
          "pytest discovery、plain assert rewriting、parametrize 與 fixture scope 各有責任；fixture 應提供狀態而非隱藏 assertion",
          "pure domain function 直接以輸入輸出測試；filesystem／time 等 side effect 經 adapter 注入後替換，不 mock 內部每一個呼叫",
          "Pyodide 使用輕量 assertion harness；capstone 仍需在本機隔離環境以真正 pytest 驗收",
        ],
        rubric: [
          {
            criterion: "設計測試矩陣",
            passCondition: "涵蓋 happy、boundary、malformed 與 exception case，使用 parametrize 消除重複而非隱藏情境。",
          },
          {
            criterion: "選擇 mock boundary",
            passCondition: "只替換不可控 adapter，核心 normalization／ranking 使用真實資料與結果 assertion。",
          },
        ],
      }),
      practice({
        slug: "py-typed-cli-capstone",
        title: "實作：技能差距分析 CLI",
        topic: "Typed CLI Capstone",
        dependsOn: ["py-testing-fixtures-boundaries"],
        examPoints: [
          "以 package layout、type hints 與 pure domain functions 串接 JSON／CSV parsing、gap ranking 與 Markdown／JSON reporting",
          "browser 驗證核心純函式後，仍在本機隔離環境執行 pytest 與 CLI entry point，清楚處理錯誤碼",
        ],
        rubric: [
          {
            criterion: "capstone 邊界完整",
            passCondition: "parser、normalizer、domain ranking、reporter 與 CLI orchestration 分離，import 不觸發 I/O。",
          },
          {
            criterion: "輸入、輸出與錯誤可驗證",
            passCondition: "JSON／CSV schema、canonicalization、deterministic ranking、Markdown／JSON 與 exit code 均有 type hints 與測試。",
          },
          {
            criterion: "本機交付 gate 通過",
            passCondition: "在 venv 安裝後以 pytest 通過成功、empty、duplicate、malformed、unknown field 與 UTF-8 cases。",
          },
        ],
        practiceBlueprint: {
          objective: "完成可展示的履歷與職缺技能差距分析 CLI，讓語言、資料結構、錯誤處理、typing 與 testing 能被面試追問。",
          requirements: [
            "輸入 resume JSON：`{\"skills\": [str, ...]}`；輸入多份 job JSON 或 CSV，每筆至少含 title 與 skills，拒絕未知必要結構",
            "canonical normalization 執行 trim、casefold、alias mapping 與單筆去重；以 frequency 與履歷差集計算 gap ranking",
            "gap 依 job frequency 降冪、canonical skill 升冪穩定排序；empty dataset 回傳明確空報告而非除零或殘缺輸出",
            "輸出 machine-readable JSON 與含摘要、matched／missing skills、frequency table 的 deterministic Markdown",
            "使用 `src/skill_gap_cli/` package，至少拆分 parsers.py、domain.py、reporters.py、cli.py；pyproject 宣告 Python version、test group 與 console entry point",
            "所有 public function 有具體 type hints；外部資料做 runtime validation，不使用 Any 掩蓋 schema",
            "CLI 對 malformed JSON／CSV、未知欄位、錯誤 UTF-8 與不存在路徑輸出 stderr 診斷和非零 exit code，不吞 exception",
            "browser workspace 只跑可攜 pure core；完整 source contract 必須在本機 venv 以 pytest 執行",
          ],
          edgeCases: [
            "resume 或 jobs 為空、skills 空白、重複或只有 aliases",
            "malformed JSON、CSV 缺欄、未知欄位、skills 不是字串集合與 invalid UTF-8",
            "frequency 同分、Unicode 技能名稱與 Markdown 特殊字元時輸出仍 deterministic",
            "相同輸入重跑不共享 mutable state，import package 不讀 argv／filesystem／stdout",
          ],
          starterSignature:
            "def analyze_skill_gaps(resume: ResumeData, jobs: list[JobData], aliases: dict[str, str]) -> GapReport:",
          timeboxMinutes: 60,
          followUps: [
            "在本機建立 venv、安裝 test dependency group、執行 pytest 與 console script，記錄可重現命令。",
            "口述 normalization、frequency aggregation 與排序的 Big-O，並說明 memory trade-off。",
            "若未來接 FastAPI，哪些 parser/domain/reporter 可原封不動重用，哪些屬於新的 adapter？",
          ],
        },
      }),
      practice({
        slug: "py-cli-test-refactor-lab",
        title: "實作：重構並測試 CLI",
        topic: "Testing Refactor Lab",
        dependsOn: ["py-typed-cli-capstone"],
        examPoints: [
          "把混合 argv、filesystem、domain 與 formatting 的函式拆成可注入 boundary 與 pure core",
          "建立 pytest-style case matrix，確保 malformed input、error mapping 與 deterministic output 可回歸",
        ],
        rubric: [
          {
            criterion: "依責任完成 refactor",
            passCondition: "parser／domain／reporter 不依賴 argv 或真實 filesystem，CLI 只協調 adapter 與 exit code。",
          },
          {
            criterion: "測試隔離有效",
            passCondition: "核心不被 mock，I/O 以注入 fake 測試；cases 涵蓋 parametrize、malformed 與 exception chaining。",
          },
        ],
        practiceBlueprint: {
          objective: "重構一個難測的技能差距 CLI，建立清楚 seam 與可在 browser／本機一致驗證的核心行為。",
          requirements: [
            "將 parsing、normalization/ranking、report formatting 與 CLI orchestration 拆成獨立函式或模組",
            "用 callable adapter 注入 read/write boundary，不在 domain function import argparse、pathlib 或讀寫檔案",
            "建立 table-driven assertion cases 對應 pytest parametrize：成功、empty、duplicate、malformed 與 reporter escaping",
            "只 mock/fake filesystem boundary，核心 domain 使用真實輸入輸出；保留可診斷 exception cause",
            "限制純 Python 標準函式庫與 worker timebox，附 refactor 前後複雜度說明",
          ],
          edgeCases: [
            "reader 拋 UnicodeDecodeError 或 FileNotFoundError 時映射為可診斷 CLI error",
            "同一 fake adapter 在多個 test 間不共享輸出或 mutable fixture",
            "import domain module 不解析 argv、不呼叫 exit、不寫 stdout",
          ],
          starterSignature:
            "def run_cli(args: Sequence[str], read_text: Callable[[str], str], write_text: Callable[[str, str], None]) -> int:",
          timeboxMinutes: 45,
          followUps: [
            "把 browser assertion cases 搬到 pytest fixture／parametrize 時，哪些測試資料可共用？",
            "何時應做 integration test 走完整 CLI，而不是繼續增加 mock？",
          ],
        },
      }),
    ],
  },
  {
    slug: "python-objects-interviews",
    title: "物件設計與 Coding Interview",
    lessons: [
      concept({
        slug: "py-classes-dataclasses",
        title: "Class、Instance 與 Dataclass",
        topic: "Object Design",
        dependsOn: ["py-cli-test-refactor-lab"],
        intro: {
          hook: "class attribute 與 instance attribute 共用同一名稱時，lookup 與 mutation 的位置決定每個 instance 看到什麼。",
          scenarios: [
            "追蹤 class／instance namespace、method binding 與 `self`",
            "用 dataclass 表達 value object，避免 mutable default 並理解 generated equality",
          ],
          outcome: "能建立小而清楚的 Python object，正確處理 attribute lookup、value equality 與 per-instance defaults。",
        },
        examPoints: [
          "instance attribute lookup 先查 instance 再查 class；method 經 descriptor binding 傳入 self，但核心路徑不深入 descriptor 實作",
          "dataclass 可產生 init／repr／equality；mutable field 使用 `field(default_factory=...)`，frozen 也不等於深層 immutable",
        ],
        rubric: [
          {
            criterion: "區分 class 與 instance state",
            passCondition: "能預測 class attribute、instance shadowing 與 mutable class member 對多個 instance 的影響。",
          },
          {
            criterion: "設計 dataclass value",
            passCondition: "能選 field/default_factory、equality 與 frozen，並說明生成行為與巢狀 mutation 邊界。",
          },
        ],
      }),
      concept({
        slug: "py-composition-duck-typing",
        title: "Composition、Inheritance 與 Duck Typing",
        topic: "Object Design",
        dependsOn: ["py-classes-dataclasses"],
        intro: {
          hook: "Python 常依『能做什麼』合作，不必先共享龐大 class hierarchy；inheritance 是替換 contract，不只是少寫幾行。",
          scenarios: [
            "把 reporter 或 storage behavior 注入 service，以 composition 取代硬綁 subclass",
            "解釋 override、`super()` 基礎與 duck typing failure 應在哪個 boundary 出現",
          ],
          outcome: "能以行為介面選 composition 或 inheritance，不延伸到 multiple inheritance／MRO 等進階範圍。",
        },
        examPoints: [
          "duck typing 關注 object 支援的 operation；runtime 缺少 method 仍會失敗，type hints 可協助但不自動驗證",
          "composition 讓依賴可替換且邊界較小；inheritance 需維持父類可替換語意，`super()` 依 method resolution 呼叫下一實作",
        ],
        rubric: [
          {
            criterion: "選擇 reuse 關係",
            passCondition: "能依 is-a／has-a 與替換需求選 inheritance／composition，拒絕只以程式碼行數判斷。",
          },
          {
            criterion: "描述 duck contract",
            passCondition: "能列出 consumer 真正需要的 behavior、runtime failure 與測試方式，不要求無關 base class。",
          },
        ],
      }),
      practice({
        slug: "py-junior-coding-lab",
        title: "實作：Junior 限時 Coding Lab",
        topic: "Coding Interview Lab",
        dependsOn: ["py-composition-duck-typing"],
        examPoints: [
          "在限時內以 frequency map、set、stack／deque、sorting key 或基本 sliding window 解題",
          "先釐清 input/output 與 edge cases，再以 tests 與 Big-O 驗證；不擴張到 tree／graph／DP",
        ],
        rubric: [
          {
            criterion: "解法正確且可溝通",
            passCondition: "先說明 invariant 與資料結構，再寫出通過 empty／duplicate／tie cases 的純函式。",
          },
          {
            criterion: "複雜度與 Python 慣例合理",
            passCondition: "能精確說明 time／space Big-O，使用 dict/set/deque/sorted key 而非不必要巢狀掃描。",
          },
        ],
        practiceBlueprint: {
          objective: "完成一組貼近 Junior 面試的職缺技能資料題，展示資料結構選擇、測試與複雜度分析。",
          requirements: [
            "題目只從 frequency map、membership set、stack／deque、stable sorting key、基本 fixed/variable sliding window 選一至兩種組合",
            "先定義 input/output 與 invariant，再實作無 side effect 的 pure function",
            "提供 4–6 條 assertion tests，涵蓋正常、empty、duplicate、tie 與 boundary window",
            "使用標準函式庫 collections 但不依賴 network/filesystem/第三方 package，不加入 tree、graph、heap、DP 或 backtracking",
            "口述時間與空間 Big-O，並指出若改用天真巢狀迴圈的成本",
          ],
          edgeCases: [
            "空輸入、單一元素與所有元素相同",
            "排序 key 同分時 deterministic tie-break",
            "window 大於資料長度、零或非法時有明確 contract",
          ],
          starterSignature:
            "def solve_skill_interview_case(items: list[str], window: int) -> list[tuple[str, int]]:",
          timeboxMinutes: 35,
          followUps: [
            "若輸入改為 iterator，哪些操作仍可 streaming、哪些必須 materialize？",
            "比較 dict/set/deque 與 list 在此題核心操作的 Big-O。",
          ],
        },
      }),
    ],
  },
];

export const pythonInterviewCoreCurriculum: CurriculumPath = {
  id: "python-interview-core",
  title: "Python Interview Core",
  description:
    "建立 Python 物件語意、惰性運算與工程邊界，完成 typed、tested 的技能差距分析 CLI。",
  subject: "Python",
  codeLanguage: "Python",
  status: "published",
  position: 3,
  recommendedPrerequisitePathIds: [],
  defaultPracticeRuntime: "python",
  units,
};
