// 最小 self-check：npx tsx src/lib/skill-tree.selfcheck.ts
import assert from "node:assert";
import { deriveNodeStates, topoLayers } from "./skill-tree";
import type { SkillTreeLesson } from "@/db/queries/skill-tree";

const L = (
  id: string,
  dependsOn: string[],
  score?: number,
): SkillTreeLesson => ({
  id,
  title: id,
  type: "concept",
  dependsOn,
  mastery: score === undefined ? null : { score, assessedAt: new Date() },
});

// a(lit) → b(可學) → c(鎖)；d 依賴 a 且達標 → lit
const lessons = [L("a", [], 100), L("b", ["a"]), L("c", ["b"]), L("d", ["a"], 69)];
const states = deriveNodeStates(lessons);
assert.equal(states.get("a"), "lit");
assert.equal(states.get("b"), "available");
assert.equal(states.get("c"), "locked");
assert.equal(states.get("d"), "available"); // 69 < 門檻，未亮但前置已達

const layers = topoLayers(lessons);
assert.deepEqual(
  ["a", "b", "c", "d"].map((id) => layers.get(id)),
  [0, 1, 2, 1],
);

console.log("skill-tree self-check OK");
