// 最小 self-check：npx tsx src/lib/mastery-decay.selfcheck.ts
import assert from "node:assert";
import { effectiveScore, isCracked } from "./mastery-decay";

const now = new Date("2026-07-19T00:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

// 剛評估不衰減
assert.equal(effectiveScore(80, now, now), 80);
// 14 天半衰
assert.equal(effectiveScore(80, daysAgo(14), now), 40);
// 未來的 assessedAt 不放大分數
assert.equal(effectiveScore(80, daysAgo(-3), now), 80);

// 100 分：7 天（有效 ~70.7）未裂，13 天（有效 ~52.5）裂
assert.equal(isCracked(100, daysAgo(7), now), false);
assert.equal(isCracked(100, daysAgo(13), now), true);
// 70 分遲滯：剛過關（有效 70，介於 55–70）不裂，5 天（有效 ~54.8）裂
assert.equal(isCracked(70, now, now), false);
assert.equal(isCracked(70, daysAgo(5), now), true);
// 從未亮燈（raw < 70）永不裂開
assert.equal(isCracked(69, daysAgo(365), now), false);

console.log("mastery-decay self-check OK");
