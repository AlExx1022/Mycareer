# python-interview-curriculum 設計

## Context

roadmap.sh Python 路線橫跨 backend、automation、data science 與 concurrency；對 React / TypeScript 主履歷而言全部納入會稀釋求職主線。本課綱以 Python 官方 Tutorial / Data Model 的語言核心，加上現代 packaging、typing 與 pytest 基礎，形成可被 Junior 面試追問且可用作品驗證的第二專長。

參考來源：

- Python 3.14 Tutorial：<https://docs.python.org/3.14/tutorial/>
- Python Data Model：<https://docs.python.org/3.14/reference/datamodel.html>
- Python typing：<https://docs.python.org/3/library/typing.html>
- Python Packaging dependency groups：<https://packaging.python.org/en/latest/specifications/dependency-groups/>
- pytest：<https://docs.pytest.org/en/stable/>
- roadmap.sh Python：<https://roadmap.sh/python>

[Speculation] 若實際目標 JD 大量要求 FastAPI / Django / SQL，應在本路徑完成後另開 Python Web Backend change；目前沒有足夠履歷與 JD 資料支持把 framework 塞進核心路徑。

## Goals / Non-Goals

**Goals:**

- 能回答 Python 特有語意：name binding、mutability、identity / equality、hashability、mutable default、LEGB、late binding、iterator / generator。
- 能以 Python collections 與標準函式完成資料轉換和 Junior coding 題，並解釋複雜度。
- 能建立具有 `pyproject.toml`、type hints、錯誤邊界與 pytest 的小型 CLI。
- 用 capstone 產生可被履歷與面試引用的 Python 證據。

**Non-Goals:**

- 完整 Python backend、data science、scraping 或 automation framework 路線。
- 深入 CPython bytecode、GIL、descriptor、metaclass、MRO 或 multiple inheritance。
- tree / graph / DP 密集演算法準備。
- 在 Pyodide 模擬 OS、socket、subprocess 或 production Python server 環境。

## Decisions

### D1：固定為 4 Unit、22 Lesson

#### Unit 1：Python 物件與資料（5 concept + 1 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `py-syntax-truthiness-control-flow` | Python 語法、Truthiness 與控制流程 | 以 Python 慣例使用縮排、`None`、短路、`for` / `while`，能與 JS 差異對照 |
| `py-binding-mutability` | 名稱綁定、可變與不可變 | assignment 不複製 object；解釋 list / dict 與 str / tuple 的 mutation 差異 |
| `py-equality-identity-hashability` | ==、is 與 Hashability | 值相等、身分、`is None`、dict / set key 限制 |
| `py-collections-selection` | List、Tuple、Dict、Set 怎麼選 | 依順序、唯一性、查找、可變性與 key contract 選資料結構 |
| `py-pythonic-iteration-transform` | Pythonic 迭代與轉換 | slicing、unpacking、enumerate、zip、comprehension、sorted key、any / all |
| `py-job-skills-normalizer` | 實作：職缺技能資料正規化 | 處理大小寫、同義詞、去重、分組與穩定排序 |

#### Unit 2：函式、Scope 與惰性運算（5 concept + 1 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `py-function-signatures` | Python 函式簽名 | positional / keyword、default、`*args` / `**kwargs`、`/` / `*` contract |
| `py-mutable-default-trap` | Mutable Default Argument | 說明 default 建立時機，使用 `None` sentinel 或 factory 修復 |
| `py-legb-closure-late-binding` | LEGB、Closure 與 Late Binding | 解釋 scope lookup 與 loop closure 取得最後值的原因 |
| `py-iterable-iterator-generator` | Iterable、Iterator 與 Generator | `iter` / `next` / `yield`、一次性消耗、lazy memory trade-off |
| `py-decorator-fundamentals` | Decorator 的本質 | function 是 object、wrapper / closure、`functools.wraps` |
| `py-lazy-pipeline-lab` | 實作：惰性資料 Pipeline | generator 逐筆轉換，decorator 記錄行為，測 mutable default / late binding |

#### Unit 3：模組、錯誤、型別與測試（5 concept + 2 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `py-exceptions-context-managers` | Exception 與 Context Manager | 精確 catch / raise / finally，使用 `with` 保證資源釋放 |
| `py-modules-packages-imports` | Module、Package 與 Import | namespace、import side effect、`__init__.py`、`if __name__ == "__main__"` |
| `py-venv-pyproject-dependencies` | venv、pyproject 與依賴 | 隔離環境、project metadata / dependencies，不綁死特定 package manager |
| `py-type-hints-runtime-boundary` | Python Type Hints | `T | None`、collections、Callable / TypedDict；annotation 不由 runtime 自動強制 |
| `py-testing-fixtures-boundaries` | pytest、Fixture 與 Mock Boundary | AAA、parametrize、fixture；mock filesystem / network / time 而非核心邏輯 |
| `py-typed-cli-capstone` | 實作：技能差距分析 CLI | 讀 JSON / CSV、輸出 JSON / Markdown、錯誤碼、type hints、package entry point |
| `py-cli-test-refactor-lab` | 實作：重構並測試 CLI | 分離 parser / domain / reporter，加入 fixture、parametrize 與 malformed input tests |

#### Unit 4：物件設計與 Coding Interview（2 concept + 1 practice）

| slug | title | 核心驗收 |
| --- | --- | --- |
| `py-classes-dataclasses` | Class、Instance 與 Dataclass | instance / class attributes、`self`、`default_factory`、value equality |
| `py-composition-duck-typing` | Composition、Inheritance 與 Duck Typing | override / `super` 基礎，說明何時 composition 較簡單、介面以行為為主 |
| `py-junior-coding-lab` | 實作：Junior 限時 Coding Lab | frequency map、stack / deque、sorting key 題，附 tests 與 Big-O 說明 |

### D2：Capstone 是可展示 CLI，不是 Web API

`py-typed-cli-capstone` 與後續 refactor 共用同一題目 lineage：

- 輸入：履歷技能 JSON 與多份職缺 JSON / CSV。
- domain：技能正規化、同義詞 mapping、frequency、缺口排序。
- 輸出：JSON 與 Markdown 報告。
- 結構：`src/` package、`pyproject.toml`、CLI entry point、pure domain functions。
- 錯誤：空資料、重複技能、malformed JSON、未知欄位、UTF-8。
- 測試：正常、boundary、failure、parametrize；filesystem 只在 adapter boundary。

選 CLI 而非 FastAPI，是為了讓語言、資料結構、模組與測試能力直接可見，不讓 framework routing 掩蓋核心。Web backend 留給目標 JD 驗證後的後續 change。

### D3：Pyodide 課程只使用可攜 subset

practice 限標準函式庫與純 Python；不依賴 socket、subprocess、native extension 或特定 OS path。測試採 assertion / 輕量 harness，在 worker timeout 內完成。`pyproject.toml`、venv 與 pytest concept 可教真實本機工程語意，但 browser runner 不假裝自己是完整本機環境；capstone blueprint 同時輸出可下載的 source bundle 需求列為 follow-up，不在本 change 實作檔案系統匯出。

### D4：Coding Interview 只保留高槓桿 patterns

核心只驗收 dict / set frequency、stack / queue (`deque`)、sorting key 與基本 sliding window。Tree、graph、heap、linked list、recursion / backtracking、DP 另開 DSA path；不因 Python roadmap 有列就加入本課綱。

## Risks / Trade-offs

- [Pyodide 與本機 Python 行為 / package 可用性不同] → intro 明確標示 runner 邊界；所有課綱解答限制標準函式庫與可攜語法。
- [履歷上 Python 仍缺少 production backend 證據] → capstone 證明語言與工程基本功，但不得在履歷描述成 backend 經驗。
- [22 節點無法涵蓋所有常見 Python trivia] → 以 object model 與 bug patterns 為核心；walrus、pattern matching、regex 等按題目需要補充，不獨立成站。
- [practice 需要 pytest 但 browser harness 不是真 pytest] → concept 與 blueprint 使用 pytest 語意；runner tests 驗證函式行為，最終 capstone 必須另以本機 Python / pytest 跑一次作交付 gate。

