// self-check：npx tsx src/lib/practice-session/llm.selfcheck.ts（純 schema 驗證，不打 LLM）
import assert from "node:assert";
import { exerciseSchema, reviewSchema } from "./llm";

const exercise = exerciseSchema.safeParse({
  description: "實作 debounce",
  starterCode: "export function debounce() { /* TODO */ }",
  testCode: 'describe("debounce", () => { it("延遲執行", () => {}); });',
});
assert.ok(exercise.success, "合法 exercise 應通過");

assert.ok(
  !exerciseSchema.safeParse({ description: "缺起始碼與測試" }).success,
  "缺欄位的 exercise 應擋下",
);

const review = reviewSchema.safeParse({
  verdict: "pass",
  comments: ["命名清楚"],
  weaknesses: [],
});
assert.ok(review.success, "合法 review 應通過");

assert.ok(
  !reviewSchema.safeParse({ verdict: "maybe", comments: [], weaknesses: [] })
    .success,
  "verdict 非 pass/fail 應擋下",
);

assert.ok(
  !reviewSchema.safeParse({
    verdict: "fail",
    comments: [],
    weaknesses: [{ criterion: "x" }],
  }).success,
  "weakness 缺 summary 應擋下",
);

console.log("practice llm schema self-check OK");
