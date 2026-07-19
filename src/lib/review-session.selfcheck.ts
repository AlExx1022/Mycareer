// 最小 self-check：npx tsx --env-file=.env src/lib/review-session.selfcheck.ts
import assert from "node:assert";
import { reviewScore } from "./review-session";

const r = (correct: boolean, wrongOnce: boolean) => ({ correct, wrongOnce });

// 全部首次答對 → 100
assert.equal(reviewScore([r(true, false), r(true, false), r(true, false)]), 100);
// 全部答錯過 → 70
assert.equal(reviewScore([r(true, true), r(true, true), r(true, true)]), 70);
// 4 題對 2 → 70 + 15 = 85
assert.equal(
  reviewScore([r(true, false), r(true, false), r(true, true), r(true, true)]),
  85,
);
// 3 題對 1 → 70 + 10 = 80
assert.equal(reviewScore([r(true, false), r(true, true), r(true, true)]), 80);

console.log("review-session self-check OK");
