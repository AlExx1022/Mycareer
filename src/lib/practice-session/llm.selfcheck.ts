// self-check：npx tsx src/lib/practice-session/llm.selfcheck.ts（純 schema 驗證，不打 LLM）
import assert from "node:assert";
import { exerciseSchema, reviewSchema, looksCorrupted } from "./llm";

const exercise = exerciseSchema.safeParse({
  version: 2,
  description: "實作 debounce",
  entryFile: "/debounce.ts",
  files: [
    {
      path: "/debounce.ts",
      code: "export function debounce() { /* TODO */ }",
      role: "starter",
      readOnly: false,
    },
    {
      path: "/debounce.test.ts",
      code: 'describe("debounce", () => { it("延遲執行", () => {}); });',
      role: "test",
      readOnly: true,
    },
  ],
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

// ---- 換行跳脫壞掉偵測（LLM 有時把換行寫成字面上的 \n） ----

const realMultilineCode = `import React, { useState } from 'react';

export const Foo = () => {
  return null;
};
`;
assert.ok(!looksCorrupted(realMultilineCode), "真正換行的程式碼不該被判定壞掉");

const literalEscapedCode =
  "import React, { useState } from 'react';\\n\\nexport const Foo = () => {\\n  return null;\\n};";
assert.ok(
  looksCorrupted(literalEscapedCode),
  "字面上的 \\n 沒有真換行應判定壞掉",
);

assert.ok(!looksCorrupted("短字串\\n"), "太短的字串不該誤判");
assert.ok(
  !looksCorrupted("完全沒有跳脫符號的普通長字串完全沒有跳脫符號的普通長字串"),
  "沒有 \\n 字面就不該誤判",
);

console.log("practice llm schema self-check OK");
