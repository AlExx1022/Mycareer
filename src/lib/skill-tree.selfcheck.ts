// 最小 self-check：npx tsx src/lib/skill-tree.selfcheck.ts
import assert from "node:assert";
import { curriculum } from "@/db/curriculum/react-junior-mid";
import {
  CENTER_X,
  MAP_W,
  deriveNodeStates,
  layoutSkillTree,
  topoLayers,
} from "./skill-tree";
import type { SkillTreeLesson } from "@/db/queries/skill-tree";

const L = (
  id: string,
  dependsOn: string[],
  score?: number,
  cracked = false,
): SkillTreeLesson => ({
  id,
  title: id,
  type: "concept",
  topic: null,
  dependsOn,
  mastery:
    score === undefined
      ? null
      : { score, assessedAt: new Date(), effective: score, cracked },
});

// a(lit) → b(可學) → c(鎖)；d 依賴 a 且達標 → lit
const lessons = [L("a", [], 100), L("b", ["a"]), L("c", ["b"]), L("d", ["a"], 69)];
const states = deriveNodeStates(lessons);
assert.equal(states.get("a"), "lit");
assert.equal(states.get("b"), "available");
assert.equal(states.get("c"), "locked");
assert.equal(states.get("d"), "available"); // 69 < 門檻，未亮但前置已達

// C6.1 直立單線：全站落在中央路線上、y 由上往下遞增、寬固定 MAP_W
const layout = layoutSkillTree([{ id: "u1", title: "React 基礎", lessons }]);
assert.equal(layout.width, MAP_W);
assert.ok(layout.nodes.every((n) => n.x === CENTER_X));
for (let i = 1; i < layout.nodes.length; i++) {
  assert.ok(layout.nodes[i].y > layout.nodes[i - 1].y, "站點 y 應遞增");
}
// 依賴（a→b→c）在縱列中排前面：a 的 y 最小
const yOf = (id: string) => layout.nodes.find((n) => n.lesson.id === id)!.y;
assert.ok(yOf("a") < yOf("b") && yOf("b") < yOf("c"));

// C5：裂開節點顯示 cracked，但不鎖下游（解鎖看 raw score）
const crackedStates = deriveNodeStates([L("a", [], 100, true), L("b", ["a"])]);
assert.equal(crackedStates.get("a"), "cracked");
assert.equal(crackedStates.get("b"), "available");

const layers = topoLayers(lessons);
assert.deepEqual(
  ["a", "b", "c", "d"].map((id) => layers.get(id)),
  [0, 1, 2, 1],
);

// C4.6 課綱完整性：一節點一概念——concept 節點必有 topic 與 intro，examPoints 2–3 點
// （難度遞進為策展約定，順序語意無法自動驗證，只驗數量與欄位齊全）
for (const u of curriculum) {
  for (const l of u.lessons) {
    assert.ok(l.topic, `${l.slug} 缺 topic`);
    if (l.type !== "concept") continue;
    assert.ok(
      l.examPoints.length >= 2 && l.examPoints.length <= 3,
      `${l.slug} examPoints 應為 2–3 點（現 ${l.examPoints.length}）`,
    );
    assert.ok(l.intro.hook, `${l.slug} intro 缺 hook`);
    assert.ok(
      l.intro.scenarios.length >= 1 && l.intro.scenarios.length <= 2,
      `${l.slug} intro.scenarios 應為 1–2 個`,
    );
    assert.ok(l.intro.outcome, `${l.slug} intro 缺 outcome`);
  }
}
const total = curriculum.flatMap((u) => u.lessons).length;
assert.ok(total >= 20, `節點數 ${total}，重策展後應 ≥ 20`);

console.log("skill-tree self-check OK");
