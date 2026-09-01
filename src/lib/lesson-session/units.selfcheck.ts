// self-check：npx tsx src/lib/lesson-session/units.selfcheck.ts（純邏輯驗證，不打 LLM）
import assert from "node:assert";
import {
  unitQuestionsGenSchema,
  toUnitQuestion,
  judgeAnswer,
  stripQuestion,
  freshUnitsState,
  type UnitQuestion,
} from "./units";

// ---- 平面生成 schema ----

const genItem = {
  type: "choice",
  prompt: "useState 回傳什麼？",
  options: ["陣列", "物件", "函式"],
  answer: 0,
  answers: [],
  lefts: [],
  rights: [],
  expectedPoints: [],
  explanation: "回傳 [value, setter] 陣列。",
  wrongSummary: "不清楚 useState 的回傳形狀",
};
assert.ok(
  unitQuestionsGenSchema.safeParse({ questions: [genItem, genItem, genItem] })
    .success,
  "合法題組應通過",
);
assert.ok(
  !unitQuestionsGenSchema.safeParse({ questions: [genItem] }).success,
  "少於 3 題應擋下",
);

// ---- toUnitQuestion 轉換與必要條件 ----

const parsed = unitQuestionsGenSchema.parse({
  questions: [genItem, genItem, genItem],
});
assert.ok(
  toUnitQuestion(parsed.questions[0], "u0q0")?.type === "choice",
  "合法 choice 應轉換成功",
);
assert.equal(
  toUnitQuestion({ ...parsed.questions[0], answer: 9 }, "x"),
  null,
  "choice answer 超出範圍應丟棄",
);
assert.equal(
  toUnitQuestion({ ...parsed.questions[0], type: "fill" }, "x"),
  null,
  "fill 沒有 answers 應丟棄",
);
assert.equal(
  toUnitQuestion(
    { ...parsed.questions[0], type: "match", lefts: ["a", "b"], rights: ["c"] },
    "x",
  ),
  null,
  "match 左右長度不符應丟棄",
);
const m = toUnitQuestion(
  {
    ...parsed.questions[0],
    type: "match",
    lefts: ["L0", "L1", "L2"],
    rights: ["R0", "R1", "R2"],
  },
  "x",
);
assert.ok(
  m?.type === "match" && m.pairs.length === 3 && m.rightOrder.length === 3,
  "match 應建 pairs 與 rightOrder",
);

// ---- fill 比對 ----

const fill: UnitQuestion = {
  id: "u0q0",
  type: "fill",
  prompt: "___",
  answers: ["useEffect", "use effect"],
  explanation: "e",
  wrongSummary: "w",
};
assert.ok(judgeAnswer(fill, "  USEEFFECT "), "trim + 大小寫不敏感應判對");
assert.ok(judgeAnswer(fill, "use effect"), "同義答案應判對");
assert.ok(!judgeAnswer(fill, "useLayoutEffect"), "錯字應判錯");
assert.ok(!judgeAnswer(fill, 123), "非字串應判錯");

// ---- match 亂序判定 ----

const match: UnitQuestion = {
  id: "u0q1",
  type: "match",
  prompt: "配對",
  pairs: [
    { left: "L0", right: "R0" },
    { left: "L1", right: "R1" },
    { left: "L2", right: "R2" },
  ],
  rightOrder: [2, 0, 1], // 顯示順序：R2, R0, R1
  explanation: "e",
  wrongSummary: "w",
};
// L0 → R0 在顯示位置 1、L1 → R1 在位置 2、L2 → R2 在位置 0
assert.ok(judgeAnswer(match, [1, 2, 0]), "正確配對（亂序還原）應判對");
assert.ok(!judgeAnswer(match, [0, 1, 2]), "照顯示順序直配應判錯");
assert.ok(!judgeAnswer(match, [1, 2]), "長度不符應判錯");

// ---- choice ----

const choice: UnitQuestion = {
  id: "u0q2",
  type: "choice",
  prompt: "?",
  options: ["a", "b", "c"],
  answer: 2,
  explanation: "e",
  wrongSummary: "w",
};
assert.ok(judgeAnswer(choice, 2), "選對 index 應判對");
assert.ok(!judgeAnswer(choice, "2"), "字串 index 應判錯（型別嚴格）");

// ---- payload 剝除 ----

for (const q of [fill, match, choice]) {
  const stripped = JSON.stringify(stripQuestion(q));
  assert.ok(!stripped.includes("explanation"), `${q.type} 剝除後不含解析`);
  assert.ok(!stripped.includes("wrongSummary"), `${q.type} 剝除後不含弱點摘要`);
}
assert.ok(
  !JSON.stringify(stripQuestion(fill)).includes("useEffect"),
  "fill 剝除後不含正解",
);
const strippedMatch = stripQuestion(match);
assert.ok(
  strippedMatch.type === "match" &&
    strippedMatch.rights.join(",") === "R2,R0,R1",
  "match 右側依 rightOrder 亂序下發",
);
const free: UnitQuestion = {
  id: "u0q3",
  type: "free",
  prompt: "?",
  expectedPoints: ["祕密要點"],
  explanation: "e",
  wrongSummary: "w",
};
assert.ok(
  !JSON.stringify(stripQuestion(free)).includes("祕密要點"),
  "free 剝除後不含判定要點",
);

// ---- 單元導出 ----

const us = freshUnitsState({
  lessonId: "x",
  title: "t",
  lessonType: "concept",
  topic: "test",
  intro: null,
  subject: "React",
  codeLanguage: "TypeScript",
  pathId: "react-junior-mid",
  pathTitle: "React Junior → Mid",
  examPoints: ["p1", "p2"],
  rubric: [],
  practiceRuntime: null,
  practiceBlueprint: null,
});
assert.equal(us.units.length, 2, "每個考點一個單元");
assert.equal(us.currentUnit, 0, "從第一單元開始");

console.log("units self-check OK");
